const League = require('../models/League'); 
const Tournament = require('../models/Tournament'); 
const User = require('../models/User'); 
const JoinRequest = require('../models/JoinRequest');
const { calculatePrizes } = require('../utils/prizeUtils');

exports.respondToJoinRequest = async (req, res) => {
  const { requestId, action } = req.params; // `requestId` and `action` (approve or decline)
  const userId = req.user.id; // Authenticated user ID

  try {
    // Log before fetching the join request

    const joinRequest = await JoinRequest.findById(requestId);
    
    if (!joinRequest) {
      return res.status(404).json({ message: 'Join request not found or unauthorized' });
    }
    

    // Verify if the user making the request matches the stored user ID
    if (joinRequest.userId.toString() !== userId) {
      return res.status(404).json({ message: 'Join request not found or unauthorized' });
    }

    // Ensure the request is still pending
    if (joinRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Request is no longer pending' });
    }

    // Check reference type (league or tournament)
    const referenceType = joinRequest.referenceType.toLowerCase(); ;

    if (!['league', 'tournament'].includes(referenceType)) {
      console.error(`❌ Invalid reference type: ${referenceType}`);
      return res.status(400).json({ message: 'Invalid reference type' });
    }

    // Fetch the reference entity (League or Tournament)
    const referenceEntity = await (referenceType === 'league' 
      ? League.findById(joinRequest.referenceId) 
      : Tournament.findById(joinRequest.referenceId));

    if (!referenceEntity) {
      return res.status(404).json({ message: `${referenceType.charAt(0).toUpperCase() + referenceType.slice(1)} not found` });
    }

    // Check if user is already a member
    if (referenceEntity.members.includes(userId)) {
      joinRequest.status = 'declined';
      await joinRequest.save();
      return res.status(400).json({ message: 'User is already a member of this ' + referenceType });
    }

    // Fetch the user to check their wallet balance
    const user = await User.findById(userId);
    if (!user) {
      console.error(`❌ User not found: ${userId}`);
      return res.status(404).json({ message: 'User not found' });
    }

    // Handle the action (approve or decline)
    if (action === 'approve') {

      if (user.balance < referenceEntity.fee) {
        return res.status(400).json({ message: 'Insufficient funds, deposit money into wallet' });
      }

      // Deduct fee and save user
      user.balance -= referenceEntity.fee;
      await user.save();

      // Add user to the members list
      referenceEntity.members.push(userId);

      // Update prize pool and awards
      const { netPrizePool, prizes } = calculatePrizes(referenceEntity);
      referenceEntity.prizePool = netPrizePool;
      referenceEntity.awardsDistribution = prizes; // Ensure schema supports this field

      await referenceEntity.save();

      // Update the join request status
      joinRequest.status = 'approved';
    } else if (action === 'decline') {
      joinRequest.status = 'declined';
    }

    // Save the join request
    await joinRequest.save();

    // Send final response
    res.status(200).json({ message: `Request ${action}ed successfully for ${referenceType}` });
    console.log('✅ Response sent');
  } catch (error) {
    console.error('❌ Error responding to join request:', error);
    res.status(500).json({ message: 'Error processing request' });
  }
};

exports.getJoinRequests = async (req, res) => {
  const userId = req.user.id;

  try {
    // Fetch all join requests for the user (both leagues and tournaments)
    const requests = await JoinRequest.find({ userId, status: 'pending' })
      .populate({
        path: 'referenceId', // Populate either League or Tournament
        select: 'name fee creator',
        populate: {
          path: 'creator', // Populate creator details
          select: 'username',
        },
      });

    // Format the requests for the frontend
    const formattedRequests = requests.map(request => ({
      id: request._id,
      name: request.referenceId?.name || 'N/A', // League/Tournament name
      fee: request.referenceId?.fee || 'N/A', // League/Tournament fee
      creator: request.referenceId?.creator?.username || 'N/A', // Creator's username
      type: request.referenceType, // Specify if it's a league or tournament
    }));

    // Send response
    res.json({ requests: formattedRequests });
  } catch (error) {
    console.error('Error fetching join requests:', error);
    res.status(500).json({ message: 'Failed to retrieve join requests' });
  }
};

