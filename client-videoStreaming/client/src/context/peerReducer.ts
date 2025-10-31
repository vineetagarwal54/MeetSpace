// import { type } from 'os';
// import { act } from "react-dom/test-utils";
// import {
//   ADD_PEER,
//   REMOVE_PEER,
//   UPDATE_VIDEO,
//   UPDATE_AUDIO,
//   ADD_PEER_NAME,
// } from "./peerActions";

// export type PeerState = Record<string, { stream?: MediaStream, userName?:string, isVideoOn?: boolean, isAudioOn?: boolean }>;

// type PeerAction =
//   | {
//       type: typeof ADD_PEER;
//       payload: { peerId: string; stream: MediaStream };
//     }
//   | {
//       type: typeof REMOVE_PEER;
//       payload: { peerId: string };
//     }
//   | {
//       type: typeof UPDATE_VIDEO;
//       payload: { peerId: string; isVideoOn: boolean };
//     }
//   | {
//       type: typeof UPDATE_AUDIO;
//       payload: { peerId: string; isAudioOn: boolean };
//     }
//     |{
//       type: typeof ADD_PEER_NAME;
//       payload : {peerId: string; userName: string}
//     };

// export const peersReducer = (state: PeerState, action: PeerAction) => {
//   switch (action.type) {
//     case ADD_PEER:
//       return {
//         ...state,
//         [action.payload.peerId]: {
//           ...state[action.payload.peerId],
//           stream: action.payload.stream,
//         },
//       };
//     case REMOVE_PEER:
//       const { [action.payload.peerId]: deleted, ...rest } = state;
//       return rest;
//     case UPDATE_VIDEO:
//       return {
//         ...state,
//         [action.payload.peerId]: {
//           ...state[action.payload.peerId],
//           isVideoOn: action.payload.isVideoOn,
//         },
//       };
//     case UPDATE_AUDIO:
//       return {
//         ...state,
//         [action.payload.peerId]: {
//           ...state[action.payload.peerId],
//           isAudioOn: action.payload.isAudioOn,
//         },
//       };
//     case ADD_PEER_NAME:
//       return {
//         ...state,
//         [action.payload.peerId] : {
//           ...state[action.payload.peerId],
//           userName: action.payload.userName,
//         }
//       }
//     default:
//       return { ...state };
//   }
// };

import {
  ADD_PEER,
  REMOVE_PEER,
  UPDATE_VIDEO,
  UPDATE_AUDIO,
  ADD_PEER_NAME,
} from "./peerActions";

export type PeerState = Record<
  string,
  { stream?: MediaStream; userName?: string; isVideoOn?: boolean; isAudioOn?: boolean }
>;

type PeerAction =
  | {
      type: typeof ADD_PEER;
      payload: { peerId: string; stream: MediaStream };
    }
  | {
      type: typeof REMOVE_PEER;
      payload: { peerId: string };
    }
  | {
      type: typeof UPDATE_VIDEO;
      payload: { peerId: string; isVideoOn: boolean };
    }
  | {
      type: typeof UPDATE_AUDIO;
      payload: { peerId: string; isAudioOn: boolean };
    }
  | {
      type: typeof ADD_PEER_NAME;
      payload: { peerId: string; userName: string };
    };

export const peersReducer = (state: PeerState, action: PeerAction): PeerState => {
  switch (action.type) {
    case ADD_PEER:
      return {
        ...state,
        [action.payload.peerId]: {
          ...state[action.payload.peerId],
          stream: action.payload.stream,
          isVideoOn:true,
          isAudioOn:true,
        },
      };
    case REMOVE_PEER:
      const { [action.payload.peerId]: deleted, ...rest } = state;
      return rest;
    case UPDATE_VIDEO:
      return {
        ...state,
        [action.payload.peerId]: {
          ...state[action.payload.peerId],
          isVideoOn: action.payload.isVideoOn,
        },
      };
    case UPDATE_AUDIO:
      return {
        ...state,
        [action.payload.peerId]: {
          ...state[action.payload.peerId],
          isAudioOn: action.payload.isAudioOn,
        },
      };
    case ADD_PEER_NAME:
      return {
        ...state,
        [action.payload.peerId]: {
          ...state[action.payload.peerId],
          userName: action.payload.userName,
        },
      };
    default:
      return { ...state };
  }
};
