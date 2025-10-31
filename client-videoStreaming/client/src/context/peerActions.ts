export const ADD_PEER = "ADD_PEER" as const;
export const REMOVE_PEER = "REMOVE_PEER" as const;
export const UPDATE_VIDEO = "UPDATE_VIDEO" as const;
export const UPDATE_AUDIO = "UPDATE_AUDIO" as const;
export const ADD_PEER_NAME = "ADD_PEER_NAME" as const;


export const  updateVideoAction = (peerId: string, isVideoOn: boolean) => ({
  type: UPDATE_VIDEO,
  payload: { peerId, isVideoOn },
});


export const addPeerAction = (peerId: string, stream:MediaStream) => ({
    type: ADD_PEER,
    payload: { peerId , stream },
})

export const removePeerAction = (peerId: string) => ({
    type: REMOVE_PEER,
    payload: { peerId },
})

export const updateAudioAction = (peerId:string, isAudioOn:boolean) => ({
  type:UPDATE_AUDIO,
  payload: {peerId,isAudioOn}
})

export const addPeerNameAction = (peerId: string, userName: string) => ({
  type: ADD_PEER_NAME,
  payload: { peerId, userName },
});


