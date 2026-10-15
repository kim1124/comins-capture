import {capture,CaptureError} from 'comins-capture';
/** Example-owned lifecycle; this helper is not a package export. */
export function createSession(){
 let controller,snapshot,url,closed=false,busy=false;
 return {
  get snapshot(){return snapshot;},
  get closed(){return closed;},
  async run(target,ready){
   if(closed)throw new CaptureError('DISPOSED','prepare');
   if(busy)throw new CaptureError('BUSY','prepare');
   busy=true;controller=new AbortController();snapshot?.dispose();if(url)URL.revokeObjectURL(url);url=undefined;
   try{
    const captured=await capture(target,{signal:controller.signal,ready});
    if(closed){captured.dispose();throw new CaptureError('DISPOSED','prepare');}
    snapshot=captured;const result=await snapshot.toBlob({signal:controller.signal});
    if(closed)throw new CaptureError('DISPOSED','output');
    url=URL.createObjectURL(result.value);return {url,meta:result.meta};
   }finally{busy=false;}
  },
  dispose(){closed=true;controller?.abort();snapshot?.dispose();if(url)URL.revokeObjectURL(url);url=undefined;},
 };
}
export const cardStyle='width:240px;height:120px;background:rgb(20, 80, 160);color:white;padding:16px;box-sizing:border-box;font:16px Arial;';
