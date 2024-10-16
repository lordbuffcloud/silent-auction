import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  TextField,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Grid
} from '@mui/material';
import { Delete, Edit } from '@mui/icons-material';
import CountdownTimer from './CountdownTimer';

const AdminDashboard = ({
    items,
    onAddItem,
    onEditItem,
    onDeleteItem,
    onAddBid,
    onDeleteBid,
    onNavigateToLiveAuction,
    auctionEndDate,
    setAuctionEndDate,
    setNotification,
    onResetAuction,
  }) => {
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    image: '',
    minBid: 0,
  });
  const [editingItem, setEditingItem] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [selectedItemResults, setSelectedItemResults] = useState(null);
  const [newBid, setNewBid] = useState({ amount: '', bidder: '' });
  const [showAuctionResults, setShowAuctionResults] = useState(false);
  const [isEditingEndDate, setIsEditingEndDate] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetConfirmation, setResetConfirmation] = useState('');

  const handleEditItem = () => {
    if (editingItem.name && editingItem.description) {
      const updatedItem = {
        ...editingItem,
        id: editingItem.id.toString(), // Ensure ID is a string
        minBid: parseFloat(editingItem.minBid) || 0
      };
      
      onEditItem(updatedItem)
        .then(() => {
          setEditingItem(null);
          setNotification({ message: "Item updated successfully!", type: "success" });
        })
        .catch((error) => {
          console.error('Error updating item:', error);
          setNotification({ message: `Failed to update item: ${error.message}`, type: "error" });
        });
    }
  };

  const handleDeleteItem = (id) => {
    const deleteResult = onDeleteItem(id);
    
    if (deleteResult && typeof deleteResult.then === 'function') {
      deleteResult
        .then(() => {
          setNotification({ message: "Item deleted successfully!", type: "success" });
        })
        .catch((error) => {
          console.error('Error deleting item:', error);
          setNotification({ message: "Failed to delete item. Please try again.", type: "error" });
        });
    } else {
      try {
        setNotification({ message: "Item deleted successfully!", type: "success" });
      } catch (error) {
        console.error('Error deleting item:', error);
        setNotification({ message: "Failed to delete item. Please try again.", type: "error" });
      }
    }
  };
  const handleImageUpload = (event, itemId) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageDataUrl = reader.result;
        if (itemId) {
          setEditingItem({ ...editingItem, image: imageDataUrl });
        } else {
          setNewItem({ ...newItem, image: imageDataUrl });
        }
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleAddItem = () => {
    if (newItem.name && newItem.description) {
      onAddItem({...newItem, image: newItem.image || '', minBid: parseFloat(newItem.minBid) || 0});
      setNewItem({ name: '', description: '', image: '', minBid: 0 });
    }
  };

  const handleShowResults = (item) => {
    console.log('Showing results for item:', item);
    setSelectedItemResults({...item});
    setShowResults(true);
  };

  const handleShowAuctionResults = () => {
    setShowAuctionResults(true);
  };

  const handleAddBid = () => {
    if (newBid.amount && newBid.bidder && selectedItemResults) {
      onAddBid(selectedItemResults.id, parseFloat(newBid.amount), newBid.bidder);
      setNewBid({ amount: '', bidder: '' });
      setSelectedItemResults(items.find((item) => item.id === selectedItemResults.id));
    }
  };

  const handleDeleteBid = async (itemId, bidIndex) => {
    console.log('Deleting bid:', itemId, bidIndex);
    try {
      await onDeleteBid(itemId, bidIndex);
      
      // Update the selectedItemResults
      const updatedItem = items.find(item => item.id === itemId);
      console.log('Updated item after deletion:', updatedItem);
      if (updatedItem) {
        // Create a new bidHistory array without the deleted bid
        const updatedBidHistory = updatedItem.bidHistory.filter((_, index) => index !== bidIndex);
        const updatedItemWithDeletedBid = {...updatedItem, bidHistory: updatedBidHistory};
        setSelectedItemResults(updatedItemWithDeletedBid);
        setNotification({ message: "Bid deleted successfully!", type: "success" });
      } else {
        setNotification({ message: "Failed to delete bid. Please try again.", type: "error" });
      }
    } catch (error) {
      console.error('Error deleting bid:', error);
      setNotification({ message: "Failed to delete bid. Please try again.", type: "error" });
    }
  };

  const getHighestBidder = (item) => {
    if (!item.bidHistory || item.bidHistory.length === 0) return { bidder: 'No bids', amount: 0 };
    return item.bidHistory.reduce((highest, current) =>
      current.amount > highest.amount ? current : highest
    );
  };
  const handleSaveAuctionEndDate = () => {
    setAuctionEndDate(auctionEndDate);
    setIsEditingEndDate(false);
};

  const handleResetAuction = () => {
    if (resetConfirmation.toLowerCase() === 'reset') {
      onResetAuction();
      setShowResetDialog(false);
      setResetConfirmation('');
      setNotification({ message: "Auction has been reset successfully!", type: "success" });
    } else {
      setNotification({ message: "Please type 'reset' to confirm.", type: "error" });
    }
  };

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>
      <Card style={{ marginBottom: '2rem', padding: '1rem' }}>
        <Typography variant="h6">Auction End Time</Typography>
        <CountdownTimer endDate={auctionEndDate} onAuctionEnd={() => {}} />
        <IconButton onClick={() => setIsEditingEndDate(true)}>
          <Edit />
        </IconButton>
      </Card>

      <Button
        variant="contained"
        onClick={() => {
          console.log('Back to Live Auction button clicked');
          onNavigateToLiveAuction();
        }}
        style={{ marginBottom: '1rem', marginRight: '1rem' }}
      >
        Back to Live Auction
      </Button>
      <Button
        variant="contained"
        onClick={handleShowAuctionResults}
        style={{ marginBottom: '1rem', marginRight: '1rem' }}
      >
        Show Auction Results
      </Button>
      <Button
        variant="contained"
        color="secondary"
        onClick={() => setShowResetDialog(true)}
        style={{ marginBottom: '1rem' }}
      >
        Reset Auction
      </Button>

      <Card style={{ marginBottom: '2rem' }}>
        <CardHeader title={editingItem ? 'Edit Auction Item' : 'Add New Auction Item'} />
        <CardContent>
          <TextField
            label="Item Name"
            value={editingItem ? editingItem.name : newItem.name}
            onChange={(e) =>
              editingItem
                ? setEditingItem({ ...editingItem, name: e.target.value })
                : setNewItem({ ...newItem, name: e.target.value })
            }
            fullWidth
            margin="normal"
          />
          <TextField
            label="Item Description"
            value={editingItem ? editingItem.description : newItem.description}
            onChange={(e) =>
              editingItem
                ? setEditingItem({ ...editingItem, description: e.target.value })
                : setNewItem({ ...newItem, description: e.target.value })
            }
            fullWidth
            margin="normal"
          />
          <input
            accept="image/*"
            style={{ display: 'none' }}
            id="raised-button-file"
            type="file"
            onChange={(e) => handleImageUpload(e, editingItem?.id)}
          />
          <label htmlFor="raised-button-file">
            <Button variant="contained" component="span">
              Upload Picture
            </Button>
          </label>
          {(newItem.image || editingItem?.image) && (
            <div style={{ marginTop: '1rem' }}>
              <img
                src={newItem.image || editingItem?.image}
                alt="Preview"
                style={{ maxWidth: '100%', maxHeight: '200px' }}
              />
            </div>
          )}
          <TextField
            label="Minimum Bid"
            type="number"
            value={editingItem ? editingItem.minBid : newItem.minBid}
            onChange={(e) =>
              editingItem
                ? setEditingItem({ ...editingItem, minBid: e.target.value })
                : setNewItem({ ...newItem, minBid: e.target.value })
            }
            fullWidth
            margin="normal"
          />
          {editingItem ? (
            <Button
              variant="contained"
              onClick={handleEditItem}
              style={{ marginLeft: '1rem' }}
            >
              Save Changes
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleAddItem}
              style={{ marginLeft: '1rem' }}
            >
              Add Item
            </Button>
          )}
          {editingItem && (
            <Button
              variant="contained"
              onClick={() => setEditingItem(null)}
              style={{ marginLeft: '1rem' }}
            >
              Cancel Edit
            </Button>
          )}
        </CardContent>
      </Card>

      <Typography variant="h5" gutterBottom>
        Current Auction Items
      </Typography>
      <Grid container spacing={2}>
        {items.map((item) => (
          <Grid item xs={12} sm={6} md={4} key={item.id}>
            <Card>
              <CardContent>
                <Typography variant="h6">{item.name}</Typography>
                <Typography variant="body2">{item.description}</Typography>
                {item.image && (
                  <img
                    src={item.image}
                    alt={item.name}
                    style={{ maxWidth: '100%', maxHeight: '200px', marginTop: '1rem' }}
                  />
                )}
                <Typography variant="body2">Minimum Bid: ${item.minBid}</Typography>
                <div style={{ marginTop: '1rem' }}>
                  <IconButton onClick={() => setEditingItem(item)}>
                    <Edit />
                  </IconButton>
                  <IconButton onClick={() => handleDeleteItem(item.id)}>
                    <Delete />
                  </IconButton>
                  <Button
                    variant="outlined"
                    onClick={() => handleShowResults(item)}
                    style={{ marginLeft: '1rem' }}
                  >
                    View Bids
                  </Button>
                </div>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={showAuctionResults} onClose={() => setShowAuctionResults(false)} maxWidth="md" fullWidth>
        <DialogTitle>Auction Results</DialogTitle>
        <DialogContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Item</TableCell>
                  <TableCell>Highest Bidder</TableCell>
                  <TableCell>Highest Bid</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item) => {
                  const highestBid = getHighestBidder(item);
                  return (
                    <TableRow key={item.id}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{highestBid.bidder}</TableCell>
                      <TableCell>${highestBid.amount}</TableCell>
                      <TableCell>
                        <Button
                          onClick={() => {
                            setSelectedItemResults(item);
                            setShowResults(true);
                          }}
                        >
                          View Bid History
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAuctionResults(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={showResults} onClose={() => setShowResults(false)} maxWidth="md" fullWidth>
        <DialogTitle>{selectedItemResults?.name} - Bid History</DialogTitle>
        <DialogContent>
          <List>
            {selectedItemResults?.bidHistory
              ?.sort((a, b) => b.amount - a.amount)
              .map((bid, index) => (
                <ListItem key={index}>
                  <ListItemText
                    primary={`Bid: $${bid.amount}`}
                    secondary={`Bidder: ${bid.bidder} - Time: ${new Date(
                      bid.time
                    ).toLocaleString()}`}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={() => handleDeleteBid(selectedItemResults.id, index)}
                    >
                      <Delete />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
          </List>
          <Typography variant="h6" style={{ marginTop: '1rem' }}>
            Add New Bid
          </Typography>
          <TextField
            label="Bidder Name"
            value={newBid.bidder}
            onChange={(e) => setNewBid({ ...newBid, bidder: e.target.value })}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Bid Amount"
            type="number"
            value={newBid.amount}
            onChange={(e) => setNewBid({ ...newBid, amount: e.target.value })}
            fullWidth
            margin="normal"
          />
          <Button
            variant="contained"
            onClick={handleAddBid}
            style={{ marginTop: '1rem' }}
          >
            Add Bid
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowResults(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={isEditingEndDate} onClose={() => setIsEditingEndDate(false)}>
                <DialogTitle>Edit Auction End Date</DialogTitle>
                <DialogContent>
                    <TextField
                        label="Auction End Date and Time"
                        type="datetime-local"
                        value={auctionEndDate}
                        onChange={(e) => setAuctionEndDate(e.target.value)}
                        fullWidth
                        margin="normal"
                        InputLabelProps={{
                            shrink: true
                        }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsEditingEndDate(false)}>Cancel</Button>
                    <Button onClick={handleSaveAuctionEndDate}>Save</Button>
                </DialogActions>
            </Dialog>

      <Dialog open={showResetDialog} onClose={() => setShowResetDialog(false)}>
        <DialogTitle>Reset Auction</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to reset the auction? This will clear all bids and start a new auction.
          </Typography>
          <Typography>
            Type 'reset' to confirm:
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            fullWidth
            value={resetConfirmation}
            onChange={(e) => setResetConfirmation(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowResetDialog(false)}>Cancel</Button>
          <Button onClick={handleResetAuction} color="secondary">
            Reset Auction
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
