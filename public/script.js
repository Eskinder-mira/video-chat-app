const socket = io();
let localStream;
let remoteStream;
let peerConnection;
const servers = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

document.getElementById("callButton").addEventListener("click", async () => {
  const roomID = document.getElementById("callInput").value;
  if (!roomID) return alert("Please enter a code to join or start a chat.");
  socket.emit("join_room", roomID);
});

socket.on("waiting_for_partner", () => alert("Waiting for another user to join..."));
socket.on("partner_found", startCall);
socket.on("room_full", () => alert("Room is full. Try a different code."));

async function startCall() {
  document.getElementById("before_call_control").classList.add("hide");
  document.getElementById("on_call_control").classList.remove("hide");

  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  document.getElementById("webcamVideo").srcObject = localStream;

  peerConnection = new RTCPeerConnection(servers);
  localStream.getTracks().forEach((track) => peerConnection.addTrack(track, localStream));

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit("candidate", { roomID, candidate: event.candidate });
    }
  };

  peerConnection.ontrack = (event) => {
    if (!remoteStream) {
      remoteStream = new MediaStream();
      document.getElementById("remoteVideo").srcObject = remoteStream;
    }
    remoteStream.addTrack(event.track);
  };

  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  socket.emit("offer", { roomID, offer });

  socket.on("offer", async (data) => {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(data));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.emit("answer", { roomID, answer });
  });

  socket.on("answer", async (data) => {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(data));
  });

  socket.on("candidate", (data) => {
    peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
  });
}

document.getElementById("hangupButton").addEventListener("click", () => {
  peerConnection.close();
  document.getElementById("before_call_control").classList.remove("hide");
  document.getElementById("on_call_control").classList.add("hide");
  alert("Call ended.");
});
