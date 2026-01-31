const PromotionalUpdate = require('../models/PromotionalUpdate');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = 'uploads/promotional';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Config
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir)
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname)
    }
});

const upload = multer({ storage: storage });

// 1. Create Update
exports.createUpdate = [
    upload.array('files', 10),
    async (req, res) => {
        try {
            console.log("Create Update Request Body:", req.body); // Log body for debugging
            console.log("Create Update Files:", req.files); // Log files for debugging

            const { title, description, type, youtubeLink, youtubeLinks, targetAudience, targetClients } = req.body;

            // Handle Youtube Links (Array or String)
            let parsedYoutubeLinks = [];
            if (youtubeLinks) {
                if (Array.isArray(youtubeLinks)) parsedYoutubeLinks = youtubeLinks;
                else parsedYoutubeLinks = [youtubeLinks];
            }

            let mediaUrls = [];
            if (req.files && req.files.length > 0) {
                mediaUrls = req.files.map(f => f.path.replace(/\\/g, "/"));
            }

            // Backward compatibility
            let mediaUrl = mediaUrls.length > 0 ? mediaUrls[0] : "";

            // Parse targetClients if it comes as a stringified JSON (common with FormData)
            let parsedTargetClients = [];
            if (targetAudience === 'specific' && targetClients) {
                try {
                    parsedTargetClients = JSON.parse(targetClients);
                } catch (e) {
                    // If it's already an array or single value, handle it
                    if (Array.isArray(targetClients)) {
                        parsedTargetClients = targetClients;
                    } else {
                        parsedTargetClients = [targetClients];
                    }
                }
            }

            const newUpdate = new PromotionalUpdate({
                title,
                description,
                type,
                mediaUrl,
                mediaUrls,
                youtubeLink: type === 'video' ? (parsedYoutubeLinks.length > 0 ? parsedYoutubeLinks[0] : youtubeLink) : "",
                youtubeLinks: type === 'video' ? parsedYoutubeLinks : [],
                targetAudience: targetAudience || 'all',
                targetClients: parsedTargetClients
            });

            await newUpdate.save();

            res.status(201).json({ success: true, message: 'Promotional Update created!', update: newUpdate });
        } catch (error) {
            console.error("Create Update Error:", error);
            res.status(500).json({ success: false, message: 'Server Error', error: error.message });
        }
    }
];

// 2. Get All Updates (Super Admin)
exports.getAllUpdates = async (req, res) => {
    try {
        const updates = await PromotionalUpdate.find()
            .populate('reactions.client', 'firstName lastName email clientID')
            .populate('targetClients', 'firstName lastName clientID') // Populate targeted clients
            .sort({ createdAt: -1 });
        res.json({ success: true, updates });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching updates' });
    }
};

// 3. Get Updates for Client
exports.getClientUpdates = async (req, res) => {
    try {
        const clientId = req.user.id;
        console.log("Fetching Updates for Client ID:", clientId);

        // Find updates where:
        // 1. targetAudience is 'all'
        // OR
        // 2. targetAudience is 'specific' AND 'targetClients' contains clientId
        // Fetch ALL updates first to debug strictly in code
        // This is temporary to rule out Mongo Query idiosyncrasies with mixed types
        const allUpdates = await PromotionalUpdate.find({}).sort({ createdAt: -1 });

        console.log(`Total updates in DB: ${allUpdates.length}`);

        const filteredUpdates = allUpdates.filter(update => {
            // Keep if targetAudience is 'all'
            if (update.targetAudience === 'all') return true;

            // Keep if targetAudience is 'specific' AND client is in the list
            if (update.targetAudience === 'specific' && update.targetClients) {
                // Convert both to strings for comparison
                const targetIds = update.targetClients.map(id => id.toString());
                const myId = clientId.toString();
                const isTargeted = targetIds.includes(myId);

                // console.log(`Checking update ${update.title}: Targets=[${targetIds}], Me=${myId}, Match=${isTargeted}`);
                return isTargeted;
            }

            return false;
        });

        console.log(`Filtered updates for client: ${filteredUpdates.length}`);

        const processedUpdates = filteredUpdates.map(update => {
            const myReaction = update.reactions.find(r => r.client.toString() === clientId);
            return {
                ...update.toObject(),
                myReaction: myReaction ? myReaction.status : null
            };
        });

        res.json({ success: true, updates: processedUpdates });
    } catch (error) {
        console.error("Client Get Updates Error:", error);
        res.status(500).json({ success: false, message: 'Error fetching updates' });
    }
};

// 4. React to Update (Client)
exports.reactToUpdate = async (req, res) => {
    try {
        const { updateId } = req.params;
        const { status } = req.body; // 'interested' or 'not_interested'
        const clientId = req.user.id;

        const update = await PromotionalUpdate.findById(updateId);
        if (!update) {
            return res.status(404).json({ success: false, message: 'Update not found' });
        }

        // Check if user already reacted
        const existingReactionIndex = update.reactions.findIndex(r => r.client.toString() === clientId);

        if (existingReactionIndex > -1) {
            // Update existing reaction
            update.reactions[existingReactionIndex].status = status;
            update.reactions[existingReactionIndex].reactedAt = Date.now();
        } else {
            // Add new reaction
            update.reactions.push({
                client: clientId,
                status,
                reactedAt: Date.now()
            });
        }

        await update.save();
        res.json({ success: true, message: 'Reaction recorded' });

    } catch (error) {
        console.error("Reaction Error:", error);
        res.status(500).json({ success: false, message: 'Error recording reaction' });
    }
};

// 5. Delete Update (Super Admin)
exports.deleteUpdate = async (req, res) => {
    try {
        const { id } = req.params;
        const update = await PromotionalUpdate.findById(id);

        if (!update) {
            return res.status(404).json({ success: false, message: 'Update not found' });
        }

        // Optional: Delete the media file associated with it
        if (update.mediaUrl && !update.mediaUrl.startsWith('http')) {
            const filePath = path.join(__dirname, '../../', update.mediaUrl);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        await PromotionalUpdate.findByIdAndDelete(id);

        res.json({ success: true, message: 'Update deleted successfully' });
    } catch (error) {
        console.error("Delete Update Error:", error);
        res.status(500).json({ success: false, message: 'Error deleting update' });
    }
};
