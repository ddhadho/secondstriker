const appFeePercentage = 0.1; 

function calculatePrizes(league) {
  const totalPrizePool = league.members.length * league.fee;
  const netPrizePool = totalPrizePool * (1 - appFeePercentage); 

  let prizes;
  switch (league.awards) {
    case 'first': 
      prizes = {
        firstPlace: netPrizePool,
        secondPlace: 0,
        thirdPlace: 0
      };
      break;
    case 'firstSecond': 
      prizes = {
        firstPlace: netPrizePool * 0.7, 
        secondPlace: netPrizePool * 0.3, 
        thirdPlace: 0
      };
      break;
    case 'topThree': 
      prizes = {
        firstPlace: netPrizePool * 0.5,  
        secondPlace: netPrizePool * 0.3,  
        thirdPlace: netPrizePool * 0.2    
      };
      break;
    default:
      throw new Error('Invalid award option selected');
  }

  return { netPrizePool, prizes };
}


module.exports = { calculatePrizes };