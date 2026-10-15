// Only for contract-1's half-blue / half-yellow synthetic fixture.
// Matching center pixels does not prove seam or full-image correctness.
export function analyzeTiles(tiles,width){
  const mismatches=[];
  for(const tile of tiles){
    const expected=tile.x+Math.floor(tile.width/2)<width/2?[32,70,189,255]:[255,205,68,255];
    if(!Array.isArray(tile.centerPixel)||expected.some((value,index)=>Math.abs(value-tile.centerPixel[index])>2)){
      mismatches.push({x:tile.x,y:tile.y,expected,actual:tile.centerPixel});
    }
  }
  return {status:mismatches.length?'fail':'unverified',sampleCount:tiles.length,tolerance:2,mismatches};
}
