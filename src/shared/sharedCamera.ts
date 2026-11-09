/**
 * Shared webcam session used by both the Bedroom and Aquarium experiences.
 * The active experience owns its own gesture model, but the browser camera
 * permission and MediaStream are acquired only once and survive scene switches.
 */

let sharedStream: MediaStream | null = null;
let pendingRequest: Promise<MediaStream> | null = null;

export function getSharedCameraStream(): MediaStream | null {
  if (sharedStream && sharedStream.getVideoTracks().some((track) => track.readyState === 'live')) {
    return sharedStream;
  }

  sharedStream = null;
  return null;
}

export async function requestSharedCameraStream(): Promise<MediaStream> {
  const existing = getSharedCameraStream();
  if (existing) return existing;
  if (pendingRequest) return pendingRequest;

  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('Webcam is not supported in this browser environment.');
  }

  pendingRequest = navigator.mediaDevices.getUserMedia({
    video: {
      width: { ideal: 640 },
      height: { ideal: 480 },
      facingMode: 'user',
    },
    audio: false,
  }).then((stream) => {
    sharedStream = stream;
    stream.getVideoTracks().forEach((track) => {
      track.addEventListener('ended', () => {
        if (sharedStream === stream) sharedStream = null;
      }, { once: true });
    });
    return stream;
  }).finally(() => {
    pendingRequest = null;
  });

  return pendingRequest;
}

/** Release the webcam only when the user explicitly turns tracking off. */
export function releaseSharedCameraStream(): void {
  const stream = sharedStream;
  sharedStream = null;
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
  }
}
