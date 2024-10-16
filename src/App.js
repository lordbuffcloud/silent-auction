import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, Typography, TextField, Button, Dialog, DialogTitle, DialogContent, DialogActions, Popover } from '@mui/material';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import confetti from 'canvas-confetti';
import AdminDashboard from './AdminDashboard';
import { ReactComponent as OmniLogo } from './omni.svg';
import AuctionResults from './AuctionResults';
import CountdownTimer from './CountdownTimer';

const API_BASE_URL = 'http://localhost:3003'; // Add this line at the top of your file, after the imports

const App = () => {
    const [items, setItems] = useState([]);
    const [notification, setNotification] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [showAdminLogin, setShowAdminLogin] = useState(false);
    const [adminPassword, setAdminPassword] = useState('');
    const [showResults, setShowResults] = useState(false);
    const [isAuctionEnded, setIsAuctionEnded] = useState(false);
    const [showLiveAuction, setShowLiveAuction] = useState(true);
    const [auctionEndDate, setAuctionEndDate] = useState(null);
    const [bidData, setBidData] = useState({});
    const [adminAnchorEl, setAdminAnchorEl] = useState(null);

    const onEditItem = async (updatedItem) => {
        try {
            console.log('Updating item:', updatedItem); // Log the item being updated

            const response = await fetch(`${API_BASE_URL}/api/items/${updatedItem.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedItem),
            });

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error(`Item with ID ${updatedItem.id} not found`);
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            // Update your local state with the updated item data
            setItems(items.map(item => item.id === updatedItem.id ? data : item));
            return data;
        } catch (error) {
            console.error('Error updating item:', error);
            throw error; // Re-throw the error so it can be caught in the component
        }
    };

    const handleDeleteItem = (itemId) => {
        fetch(`${API_BASE_URL}/api/items/${itemId}`, {
            method: 'DELETE',
        })
            .then(response => {
                if (response.ok) {
                    setItems(prevItems => prevItems.filter(item => item.id !== itemId));
                    setNotification({ message: "Item deleted successfully!", type: "success" });
                } else {
                    throw new Error('Failed to delete item');
                }
            })
            .catch(error => {
                console.error('Error deleting item:', error);
                setNotification({ message: "Failed to delete item. Please try again.", type: "error" });
            });
    };

    const onDeleteBid = async (itemId, bidIndex) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/items/${itemId}/bid/${bidIndex}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log(data.message); // Should log "Bid deleted successfully"

            // Update the items state
            setItems(prevItems => prevItems.map(item => {
                if (item.id === itemId) {
                    const updatedBidHistory = item.bidHistory.filter((_, index) => index !== bidIndex);
                    return {...item, bidHistory: updatedBidHistory};
                }
                return item;
            }));

            return true; // Indicate success
        } catch (error) {
            console.error('Error deleting bid:', error);
            throw error; // Rethrow the error to be caught in the AdminDashboard component
        }
    };

    const handleNavigateToLiveAuction = () => {
        setShowLiveAuction(true);
        setIsAdmin(false);
    };

    const handleAdminLogin = () => {
        if (adminPassword === 'cristopher') {
            setIsAdmin(true);
            setShowAdminLogin(false);
            setShowLiveAuction(false);
        } else {
            setNotification({ message: "Incorrect password. Please try again.", type: "error" });
        }
    };

    const handleAuctionEnd = () => {
        setIsAuctionEnded(true);
        setNotification({ message: "The auction has ended. View the results to see the winners!", type: "success" });
    };

    const getHighestBid = (item) => {
        if (!item.bidHistory || item.bidHistory.length === 0) {
            return 0;
        }
        return Math.max(...item.bidHistory.map(bid => bid.amount));
    };

    useEffect(() => {
        fetch(`${API_BASE_URL}/api/items`)
            .then(response => response.json())
            .then(data => {
                setItems(data.items);
                setAuctionEndDate(data.auctionEndTime ? new Date(data.auctionEndTime) : null);
            })
            .catch(error => console.error('Error fetching data:', error));
    }, []);

    const handleAddItem = (newItem) => {
        fetch(`${API_BASE_URL}/api/items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newItem),
        })
            .then(response => response.json())
            .then(addedItem => {
                setItems(prevItems => [...prevItems, addedItem]);
                setNotification({ message: "Item added successfully!", type: "success" });
            })
            .catch(error => {
                console.error('Error adding item:', error);
                setNotification({ message: "Failed to add item. Please try again.", type: "error" });
            });
    };

    const handleBidDataChange = (itemId, field, value) => {
        setBidData(prevData => ({
            ...prevData,
            [itemId]: {
                ...prevData[itemId],
                [field]: value
            }
        }));
    };

    const createImageConfetti = useCallback(() => {
        const image = new Image();
        image.src = '/leer.png'; // Make sure this path is correct
        image.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            canvas.style.position = 'fixed';
            canvas.style.top = '0';
            canvas.style.left = '0';
            canvas.style.pointerEvents = 'none';
            canvas.style.zIndex = '9999';
            document.body.appendChild(canvas);

            const ctx = canvas.getContext('2d');

            const particleCount = 30;
            const particles = [];

            for (let i = 0; i < particleCount; i++) {
                particles.push({
                    x: Math.random() * canvas.width,
                    y: canvas.height + 100,
                    speed: 2 + Math.random() * 2,
                    rotation: Math.random() * 360,
                    size: 20 + Math.random() * 20
                });
            }

            function animate() {
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                particles.forEach((p) => {
                    p.y -= p.speed;
                    p.rotation += 2;

                    ctx.save();
                    ctx.translate(p.x, p.y);
                    ctx.rotate((p.rotation * Math.PI) / 180);
                    ctx.drawImage(image, -p.size / 2, -p.size / 2, p.size, p.size);
                    ctx.restore();
                });

                if (particles.some(p => p.y > -100)) {
                    requestAnimationFrame(animate);
                } else {
                    document.body.removeChild(canvas);
                }
            }

            animate();
        };
    }, []);

    const handleBid = (itemId) => {
        const { bidderName, bidAmount } = bidData[itemId] || {};
        if (!bidderName || !bidAmount) {
            setNotification({ message: "Please enter both name and bid amount.", type: "error" });
            return;
        }

        fetch(`${API_BASE_URL}/api/items/${itemId}/bid`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: parseFloat(bidAmount), bidder: bidderName, time: new Date().toISOString() }),
        })
            .then(response => response.json())
            .then(updatedItem => {
                setItems(prevItems => prevItems.map(item =>
                    item.id === itemId ? updatedItem : item
                ));
                setNotification({ message: "Your bid has been recorded. Good luck!", type: "success" });
                
                // Trigger both confetti animations
                const learjetShape = confetti.shapeFromPath({
                    path: 'M0 0 L10 5 L0 10 L2 5 Z',
                    fill: '#3498db'
                });

                confetti({
                    particleCount: 50,
                    spread: 70,
                    origin: { y: 0.6 },
                    angle: 135,
                    shapes: [learjetShape],
                    colors: ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42', '#ffa62d', '#ff36ff'],
                });

                createImageConfetti();

                // Clear the bid data for this item
                setBidData(prevData => ({
                    ...prevData,
                    [itemId]: { bidderName: '', bidAmount: '' }
                }));
            })
            .catch(error => {
                console.error('Error placing bid:', error);
                setNotification({ message: "Failed to place bid. Please try again.", type: "error" });
            });
    };

    const handleSetAuctionEndTime = (newEndTime) => {
        if (!newEndTime || !(newEndTime instanceof Date)) {
            setNotification({ message: "Please select a valid end time.", type: "error" });
            return;
        }

        fetch(`${API_BASE_URL}/api/auction-end-time`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ endTime: newEndTime.toISOString() }),
        })
            .then(response => response.json())
            .then(data => {
                setAuctionEndDate(new Date(data.endTime));
                setNotification({ message: "Auction end time updated successfully!", type: "success" });
            })
            .catch(error => {
                console.error('Error updating auction end time:', error);
                setNotification({ message: "Failed to update auction end time. Please try again.", type: "error" });
            });
    };

    const handleUpdateMinBid = async (itemId, newMinBid) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/items/${itemId}/minBid`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ minBid: newMinBid }),
            });

            if (!response.ok) {
                throw new Error('Failed to update minimum bid');
            }

            const updatedItem = await response.json();
            setItems(items.map(item => 
                item.id === updatedItem.id ? updatedItem : item
            ));
            setNotification({ message: "Minimum bid updated successfully!", type: "success" });
        } catch (error) {
            console.error('Error updating minimum bid:', error);
            setNotification({ message: "Failed to update minimum bid. Please try again.", type: "error" });
        }
    };

    const handleAdminClick = (event) => {
        setAdminAnchorEl(event.currentTarget);
    };

    const handleAdminClose = () => {
        setAdminAnchorEl(null);
    };

    const openAdminLogin = () => {
        setShowAdminLogin(true);
        handleAdminClose();
    };

    const open = Boolean(adminAnchorEl);
    const id = open ? 'admin-popover' : undefined;

    return (
        <div style={{ padding: '1rem', background: 'linear-gradient(to bottom, #f3f4f6, #e0f2fe)', minHeight: '100vh' }}>
            <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <motion.div
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <OmniLogo style={{ width: '200px', height: 'auto' }} />
                    <Typography variant="h2" style={{ color: '#2563eb', marginBottom: '0.5rem' }}>
                        Employee Silent{' '}
                        <span 
                            onClick={handleAdminClick}
                            style={{ cursor: 'pointer', textDecoration: 'underline' }}
                            aria-describedby={id}
                        >
                            A
                        </span>
                        uction
                    </Typography>
                    <Popover
                        id={id}
                        open={open}
                        anchorEl={adminAnchorEl}
                        onClose={handleAdminClose}
                        anchorOrigin={{
                            vertical: 'bottom',
                            horizontal: 'center',
                        }}
                        transformOrigin={{
                            vertical: 'top',
                            horizontal: 'center',
                        }}
                    >
                        <Button onClick={openAdminLogin}>Admin Login</Button>
                    </Popover>
                    <Typography variant="h5" style={{ color: '#4b5563' }}>Good Luck ✈</Typography>
                    {auctionEndDate && <CountdownTimer endDate={auctionEndDate} onAuctionEnd={handleAuctionEnd} />}
                    {isAuctionEnded && (
                        <Button variant="contained" onClick={() => setShowResults(true)} style={{ marginTop: '1rem' }}>
                            View Auction Results
                        </Button>
                    )}
                </motion.div>
            </header>

            {!isAdmin && showLiveAuction && (
                <>
                    <AnimatePresence>
                        {notification && (
                            <motion.div
                                initial={{ opacity: 0, y: 50 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -50 }}
                            >
                                <Card style={{ marginBottom: '2rem', backgroundColor: '#d1fae5', borderColor: '#34d399' }}>
                                    <CardContent>
                                        <Typography variant="h5" style={{ color: '#065f46' }}>
                                            {isAuctionEnded ? "Auction Ended" : "Bid Placed Successfully!"}
                                        </Typography>
                                        <Typography variant="body1" style={{ color: '#047857' }}>
                                            {notification.message}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <motion.div
                        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, staggerChildren: 0.1 }}
                    >
                        {items.map(item => (
                            <Card key={item.id}>
                                <CardContent>
                                    <Typography variant="h6">{item.name}</Typography>
                                    <Typography variant="body2">{item.description}</Typography>
                                    {item.image && (
                                        <div style={{ width: '100%', height: '200px', overflow: 'hidden', marginBottom: '1rem' }}>
                                            <img
                                                src={item.image}
                                                alt={item.name}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                        </div>
                                    )}
                                    <Typography variant="subtitle1" style={{ marginBottom: '1rem', fontWeight: 'bold' }}>
                                        Current Highest Bid: ${getHighestBid(item)}
                                    </Typography>
                                    <Typography variant="subtitle2" style={{ marginBottom: '1rem', color: '#666' }}>
                                        Minimum Bid: ${item.minBid}
                                    </Typography>
                                    {!isAuctionEnded && (
                                        <>
                                            <TextField
                                                label="Your Name"
                                                value={bidData[item.id]?.bidderName || ''}
                                                onChange={(e) => handleBidDataChange(item.id, 'bidderName', e.target.value)}
                                                fullWidth
                                                margin="normal"
                                            />
                                            <TextField
                                                label="Bid Amount"
                                                type="number"
                                                value={bidData[item.id]?.bidAmount || ''}
                                                onChange={(e) => handleBidDataChange(item.id, 'bidAmount', e.target.value)}
                                                fullWidth
                                                margin="normal"
                                                inputProps={{ min: item.minBid }}
                                                placeholder={`Minimum bid: $${item.minBid}`}
                                            />
                                            <Button 
                                                variant="contained" 
                                                onClick={() => handleBid(item.id)}
                                                disabled={!bidData[item.id]?.bidAmount || parseFloat(bidData[item.id]?.bidAmount) < item.minBid}
                                            >
                                                Place Bid
                                            </Button>
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </motion.div>
                </>
            )}

            {isAdmin && (
                <AdminDashboard
                    items={items}
                    onAddItem={handleAddItem}
                    onEditItem={onEditItem}
                    onDeleteItem={handleDeleteItem}
                    onAddBid={handleBid}
                    onDeleteBid={onDeleteBid}
                    onNavigateToLiveAuction={handleNavigateToLiveAuction}
                    auctionEndDate={auctionEndDate}
                    setAuctionEndDate={handleSetAuctionEndTime}
                    setNotification={setNotification}
                    onUpdateMinBid={handleUpdateMinBid}
                >
                    <div style={{ marginBottom: '1rem' }}>
                        <Typography variant="h6" gutterBottom>Set Auction End Time</Typography>
                        <DatePicker
                            selected={auctionEndDate}
                            onChange={handleSetAuctionEndTime}
                            showTimeSelect
                            timeFormat="HH:mm"
                            timeIntervals={15}
                            timeCaption="time"
                            dateFormat="MMMM d, yyyy h:mm aa"
                            minDate={new Date()}
                            customInput={<TextField fullWidth />}
                        />
                    </div>
                </AdminDashboard>
            )}

            {showResults && <AuctionResults items={items} onClose={() => setShowResults(false)} />}

            <Dialog open={showAdminLogin} onClose={() => setShowAdminLogin(false)}>
                <DialogTitle>Admin Login</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Password"
                        type="password"
                        fullWidth
                        variant="outlined"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                                handleAdminLogin();
                            }
                        }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowAdminLogin(false)}>Cancel</Button>
                    <Button onClick={handleAdminLogin}>Login</Button>
                </DialogActions>
            </Dialog >
        </div>
    );
};

export default App;
