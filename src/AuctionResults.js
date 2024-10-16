import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';

const AuctionResults = ({ items, onClose }) => {
    // Helper function to find the highest bid for each item
    const getHighestBidder = (item) => {
        if (!item.bidHistory || item.bidHistory.length === 0) return { bidder: 'No bids', amount: 0 };
        return item.bidHistory.reduce((highest, current) =>
            current.amount > highest.amount ? current : highest
        );
    };

    return (
        <Dialog open={true} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>Auction Results</DialogTitle>
            <DialogContent>
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Item</TableCell>
                                <TableCell>Highest Bidder</TableCell>
                                <TableCell>Highest Bid</TableCell>
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
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
};

export default AuctionResults;
