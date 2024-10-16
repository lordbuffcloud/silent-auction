const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3003;
const DATA_FILE = path.join(__dirname, 'auctionData.json');

app.use(cors());
app.use(express.json({ limit: '50mb' })); 

// Helper function to read data
async function readData() {
    try {
        const data = await fs.readFile(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return { items: [], auctionEndTime: null };
    }
}

// Helper function to write data
async function writeData(data) {
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

// Get all items and auction end time
app.get('/api/items', async (req, res) => {
    try {
        const data = await readData();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Error reading data' });
    }
});

// Add new item
app.post('/api/items', async (req, res) => {
    try {
        const data = await readData();
        const newItem = { ...req.body, id: Date.now().toString(), bidHistory: [] };
        data.items.push(newItem);
        await writeData(data);
        res.status(201).json(newItem);
    } catch (error) {
        res.status(500).json({ error: 'Error adding item' });
    }
});

// Delete item
app.delete('/api/items/:id', async (req, res) => {
    try {
        const data = await readData();
        data.items = data.items.filter(item => item.id !== req.params.id);
        await writeData(data);
        res.json({ message: 'Item deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting item' });
    }
});

// Add bid to an item
app.post('/api/items/:id/bid', async (req, res) => {
    try {
        const data = await readData();
        const item = data.items.find(item => item.id === req.params.id);
        if (item) {
            item.bidHistory.push(req.body);
            await writeData(data);
            res.json(item);
        } else {
            res.status(404).json({ error: 'Item not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error adding bid' });
    }
});

// Delete a bid from an item
app.delete('/api/items/:itemId/bid/:bidIndex', async (req, res) => {
    try {
        const data = await readData();
        const { itemId, bidIndex } = req.params;
        
        const itemIndex = data.items.findIndex(item => item.id === itemId);
        if (itemIndex === -1) {
            return res.status(404).json({ error: 'Item not found' });
        }

        const bidIndexNum = parseInt(bidIndex, 10);
        if (isNaN(bidIndexNum) || bidIndexNum < 0 || bidIndexNum >= data.items[itemIndex].bidHistory.length) {
            return res.status(400).json({ error: 'Invalid bid index' });
        }

        // Remove the bid
        data.items[itemIndex].bidHistory.splice(bidIndexNum, 1);

        await writeData(data);
        res.json({ message: 'Bid deleted successfully' });
    } catch (error) {
        console.error('Error deleting bid:', error);
        res.status(500).json({ error: 'Error deleting bid' });
    }
});

// Set auction end time
app.post('/api/auction-end-time', async (req, res) => {
    try {
        const data = await readData();
        data.auctionEndTime = req.body.endTime;
        await writeData(data);
        res.json({ endTime: data.auctionEndTime });
    } catch (error) {
        res.status(500).json({ error: 'Error setting auction end time' });
    }
});

// Update item
app.put('/api/items/:id', async (req, res) => {
    try {
        const data = await readData();
        const itemIndex = data.items.findIndex(item => item.id === req.params.id);
        
        if (itemIndex === -1) {
            return res.status(404).json({ error: 'Item not found' });
        }

        // Update the item
        data.items[itemIndex] = { ...data.items[itemIndex], ...req.body };
        
        await writeData(data);
        res.json(data.items[itemIndex]);
    } catch (error) {
        console.error('Error updating item:', error);
        res.status(500).json({ error: 'Error updating item' });
    }
});

app.listen(PORT, () => {
    console.log(`where ur server points`);
});