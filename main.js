const database = supabase.createClient(
  "https://qinwxytxuqjvzvxjflii.supabase.co",
  "sb_publishable_mc3xj_FFxm81KEzal2ONvw_wpUCEdx4",
);
const authScreen = document.querySelector("#authScreen");
const signupForm = document.querySelector("#signupForm");
const loginForm = document.querySelector("#loginForm");
const chat = document.querySelector("#chat");
const signupName = document.querySelector("#signupName");
const signupEmail = document.querySelector("#signupEmail");
const signupPassword = document.querySelector("#signupPassword");
const loginEmail = document.querySelector("#loginEmail");
const loginPassword = document.querySelector("#loginPassword");
const signupBtn = document.querySelector("#signupBtn");
const loginBtn = document.querySelector("#loginBtn");
const showLogin = document.querySelector("#showLogin");
const showSignup = document.querySelector("#showSignup");
const logoutBtn = document.querySelector("#logoutBtn");
const messageInput = document.querySelector("#messageInput");
const sendBtn = document.querySelector("#sendBtn");
const chatScreen = document.querySelector("#chatScreen");
const list = document.querySelector("#list");
const roomTitle = document.querySelector("#roomTitle");
const leaveRoomBtn = document.querySelector("#leaveRoomBtn");
const deleteRoomBtn = document.querySelector("#deleteRoomBtn");
const publicRooms = document.querySelector("#publicRooms");
const privateRooms = document.querySelector("#privateRooms");
const createRoomBtn = document.querySelector("#createRoomBtn");
const createRoomForm = document.querySelector("#createRoomForm");
const roomNameInput = document.querySelector("#roomNameInput");
const roomPrivacy = document.querySelector("#roomPrivacy");
const roomPasswordBox = document.querySelector("#roomPasswordBox");
const roomPasswordInput = document.querySelector("#roomPasswordInput");
const saveRoomBtn = document.querySelector("#saveRoomBtn");
const cancelRoomBtn = document.querySelector("#cancelRoomBtn");
const roomsList = document.querySelector("#rooms");
let username = "";
let userId = "";
let channel = null;
let currentRoom = "room1";
let channelReady = false;
showLogin.addEventListener("click", function () {
  signupForm.style.display = "none";
  loginForm.style.display = "block";
});
showSignup.addEventListener("click", function () {
  loginForm.style.display = "none";
  signupForm.style.display = "block";
});
signupBtn.addEventListener("click", function () {
  const name = signupName.value.trim();
  const email = signupEmail.value.trim();
  const password = signupPassword.value;
  if (name === "" || email === "" || password === "") {
    alert("Please fill all fields");
    return;
  }
  database.auth
    .signUp({
      email: email,
      password: password,
      options: {
        data: {
          username: name,
        },
      },
    })
    .then(function (response) {
      if (response.error) {
        alert(response.error.message);
        return;
      }
      if (response.data.session) {
        alert("Account created successfully! You are logged in.!");
        username = response.data.user.user_metadata.username;
        userId = response.data.user.id;
        authScreen.style.display = "none";
        chatScreen.style.display = "flex";
        openSavedRoom();
      } else {
        alert("Account created! Please confirm your email, then log in.");
        signupForm.style.display = "none";
        loginForm.style.display = "block";
      }
    })
    .catch(function (error) {
      console.log(error);
      alert("Something went wrong. Please try again.");
    });
});
loginBtn.addEventListener("click", function () {
  const email = loginEmail.value.trim();
  const password = loginPassword.value;
  if (email === "" || password === "") {
    alert("Please fill all fields");
    return;
  }
  database.auth
    .signInWithPassword({
      email: email,
      password: password,
    })
    .then(function (response) {
      if (response.error) {
        alert(response.error.message);
        return;
      }
      username =
        response.data.user.user_metadata.username || email.split("@")[0];
      userId = response.data.user.id;
      alert("Login successful!");
      authScreen.style.display = "none";
      chatScreen.style.display = "flex";
      openSavedRoom();
    })
    .catch(function (error) {
      console.log(error);
      alert("Something went wrong. Please try again.");
    });
});
logoutBtn.addEventListener("click", function () {
  database
    .from("user_session")
    .update({ current_room: "room1" })
    .eq("user_id", userId)
    .then(function (response) {
      if (response.error) {
        console.log(response.error);
        return;
      }
      database.auth
        .signOut()
        .then(function (response) {
          if (response.error) {
            alert(response.error.message);
            return;
          }
          if (channel !== null) {
            database.removeChannel(channel);
            channel = null;
          }
          username = "";
          userId = "";
          channelReady = false;
          chatScreen.style.display = "none";
          authScreen.style.display = "flex";
          loginForm.style.display = "block";
          signupForm.style.display = "none";
          loginEmail.value = "";
          loginPassword.value = "";
          alert("Logged out successfully!");
        })
        .catch(function (error) {
          console.log(error);
        });
    });
});
function showRoomsPage() {
  chat.style.display = "none";
  roomsList.style.display = "block";
  createRoomForm.style.display = "none";
  loadRooms();
}
function joinRoom(roomName) {
  currentRoom = roomName;
  roomsList.style.display = "none";
  chat.style.display = "flex";
  deleteRoomBtn.style.display = "none";
  if (!["room1", "room2", "room3"].includes(roomName)) {
    database
      .from("rooms")
      .select("created_by")
      .eq("room_name", roomName)
      .then(function (response) {
        if (response.error) {
          console.log(response.error);
          return;
        }
        if (
          response.data.length === 1 &&
          response.data[0].created_by === userId &&
          currentRoom === roomName
        ) {
          deleteRoomBtn.style.display = "inline-block";
        }
      });
  }
  leaveRoomBtn.style.display = "inline-block";
  database
    .from("user_session")
    .select("*")
    .eq("user_id", userId)
    .then(function (response) {
      if (response.error) {
        console.log("Room select error:", response.error);
        return;
      }
      if (response.data.length === 0) {
        database
          .from("user_session")
          .insert({
            user_id: userId,
            current_room: roomName,
          })
          .then(function (result) {
            if (result.error) {
              console.log("Room insert error:", result.error);
            } else {
              console.log("Room saved successfully!");
            }
          });
      } else {
        database
          .from("user_session")
          .update({
            current_room: roomName,
          })
          .eq("user_id", userId)
          .then(function (result) {
            if (result.error) {
              console.log("Room update error:", result.error);
            } else {
              console.log("Room updated successfully!");
            }
          });
      }
    });
  if (roomName === "room1") {
    roomTitle.innerText = "💬 Room 1";
  } else if (roomName === "room2") {
    roomTitle.innerText = "💬 Room 2";
  } else if (roomName === "room3") {
    roomTitle.innerText = "💬 Room 3";
  } else {
    roomTitle.innerText = roomName;
  }
  list.innerHTML = "";
  channelReady = false;
  if (channel !== null) {
    database.removeChannel(channel).then(function () {
      channel = null;
      createChannel(roomName);
    });
  } else {
    createChannel(roomName);
  }
}
function openSavedRoom() {
  database
    .from("user_session")
    .select("current_room")
    .eq("user_id", userId)
    .then(function (response) {
      if (response.error) {
        console.log("Fetch room error:", response.error);
        return;
      }
      if (response.data.length === 0) {
        joinRoom("room1");
      } else {
        let savedRoom = response.data[0].current_room;
        joinRoom(savedRoom);
      }
    });
}
function createChannel(roomName) {
  channel = database.channel("room-" + roomName, {
    config: {
      private: false,
    },
  });
  channel
    .on("broadcast", { event: "message_sent" }, function (payload) {
      let data = payload.payload;
      console.log(data);
      createUI(data);
    })
    .subscribe(function (status) {
      console.log(status);
      if (status === "SUBSCRIBED") {
        channelReady = true;
        loadMessages();
      }
    });
}
const roomButtons = document.querySelectorAll(".roomBtn");
roomButtons.forEach(function (button) {
    button.addEventListener("click", function () {
        let roomName = button.dataset.room;
        joinRoom(roomName);
    });
});
sendBtn.addEventListener("click", function () {
  let message = messageInput.value.trim();
  if (message === "") {
    alert("Enter a message");
    return;
  }
  if (userId === "") {
    alert("Please login first");
    return;
  }
  if (channelReady === false) {
    alert("Please wait for the room to connect");
    return;
  }
  database
    .from("messages")
    .insert({
      username: username,
      text: message,
      room: currentRoom,
      user_id: userId,
    })
    .then(function (response) {
      if (response.error) {
        console.log(response.error);
        alert(response.error.message);
        return;
      }
      console.log("Message saved successfully!");
      let messageData = {
        user: username,
        text: message,
      };
      createUI(messageData);
      channel
        .send({
          type: "broadcast",
          event: "message_sent",
          payload: messageData,
        })
        .then(function (response) {
          console.log(response);
        })
        .catch(function (error) {
          console.log(error);
        });
      messageInput.value = "";
    })
    .catch(function (error) {
      console.log(error);
    });
});
function loadMessages() {
  database
    .from("messages")
    .select("*")
    .eq("room", currentRoom)
    .then(function (response) {
      if (response.error) {
        console.log(response.error);
        return;
      }
      response.data.forEach(function (msg) {
        createUI({
          user: msg.username,
          text: msg.text,
          created_at: msg.created_at,
        });
      });
    });
}
function createUI(obj) {
  let li = document.createElement("li");
  let user = document.createElement("strong");
  let message = document.createElement("p");
  let timeEl = document.createElement("span");
  let dateObj = new Date();
  timeEl.innerText = `${dateObj.getHours()}:${dateObj.getMinutes()}:${dateObj.getSeconds()}`;
  user.innerText = obj.user;
  message.innerText = obj.text;
  if (obj.user === username) {
    li.style.backgroundColor = "#d3a0f8";
    li.style.color = "#111b21";
    li.style.alignSelf = "flex-end";
  } else {
    li.style.backgroundColor = "#ff7de7";
    li.style.color = "#111b21";
    li.style.alignSelf = "flex-start";
  }
  li.style.padding = "10px 14px";
  li.style.marginBottom = "10px";
  li.style.borderRadius = "10px";
  li.style.maxWidth = "70%";
  li.style.listStyle = "none";

  user.style.display = "block";
  user.style.marginBottom = "5px";
  user.style.color = "#075e54";

  timeEl.style.display = "block";
  timeEl.style.fontSize = "11px";
  timeEl.style.textAlign = "right";
  timeEl.style.color = "#667781";

  li.appendChild(user);
  li.appendChild(message);
  li.appendChild(timeEl);
  list.appendChild(li);
  list.scrollTop = list.scrollHeight;
}
database.auth.getSession().then(function (response) {
  if (response.error) {
    console.log(response.error);
    return;
  }
  let session = response.data.session;
  if (session) {
    username =
      session.user.user_metadata.username || session.user.email.split("@")[0];
    userId = session.user.id;
    authScreen.style.display = "none";
    chatScreen.style.display = "flex";
    openSavedRoom();
  } else {
    chatScreen.style.display = "none";
    authScreen.style.display = "flex";
    loginForm.style.display = "block";
    signupForm.style.display = "none";
  }
});
createRoomBtn.addEventListener("click", function () {
  createRoomForm.style.display = "flex";
});
roomPrivacy.addEventListener("change", function () {
  if (roomPrivacy.value === "private") {
    roomPasswordBox.style.display = "block";
  } else {
    roomPasswordBox.style.display = "none";
  }
});
cancelRoomBtn.addEventListener("click", function () {
  createRoomForm.style.display = "none";
  roomNameInput.value = "";
  roomPasswordInput.value = "";
  roomPrivacy.value = "public";
  roomPasswordBox.style.display = "none";
});
saveRoomBtn.addEventListener("click", function () {
  let roomName = roomNameInput.value.trim();
  let privacy = roomPrivacy.value;
  let roomPassword = roomPasswordInput.value.trim();
  if (roomName === "") {
    alert("Please enter a room name!");
    return;
  }
  if (privacy === "private" && roomPassword === "") {
    alert("Please enter a room password!");
    return;
  }
  database
    .from("rooms")
    .insert({
      room_name: roomName,
      is_private: privacy === "private",
      created_by: userId,
      password_hash: privacy === "private" ? roomPassword : null,
    })
    .select()
    .then(function (response) {
      if (response.error) {
        console.log("Room creation error:", response.error);
        alert(response.error.message);
        return;
      }
      console.log("Room created:", response.data[0]);
      alert("Room created successfully!");
      loadRooms();
      createRoomForm.style.display = "none";
      roomNameInput.value = "";
      roomPasswordInput.value = "";
      roomPrivacy.value = "public";
      roomPasswordBox.style.display = "none";
    });
});
function loadRooms() {
  publicRooms.innerHTML = "";
  privateRooms.innerHTML = "";
  database
    .from("rooms")
    .select("id, room_name, is_private, password_hash")
    .then(function (response) {
      if (response.error) {
        console.log(response.error);
        return;
      }
      response.data.forEach(function (room) {
        let button = document.createElement("button");
        button.classList.add("roomBtn");
        if (room.is_private === true) {
          button.innerText = room.room_name;
          button.addEventListener("click", function (event) {
            event.stopPropagation();
            let enteredPassword = prompt("Enter password  ");
            if (enteredPassword === null) {
              return;
            }
            let savedPassword = room.password_hash;
            if (!savedPassword) {
              alert("No password is saved for this room!");
              return;
            }
            if (enteredPassword.trim() === savedPassword.trim()) {
              alert("Correct password! Welcome to the room.");
              joinRoom(room.room_name);
            } else {
              alert("Incorrect password! Access denied.");
              return;
            }
          });
          privateRooms.appendChild(button);
        } else {
          button.innerText = room.room_name;
          button.addEventListener("click", function () {
            joinRoom(room.room_name);
          });
          publicRooms.appendChild(button);
        }
      });
    });
}
leaveRoomBtn.addEventListener("click", function () {
  showRoomsPage();
});
deleteRoomBtn.addEventListener("click", function () {
  let roomToDelete = currentRoom;
  if (["room1", "room2", "room3"].includes(roomToDelete)) {
    alert("Default rooms cannot be deleted!");
    return;
  }
  let confirmDelete = confirm(
    "Are you sure you want to delete " + roomToDelete + "?",
  );

  if (confirmDelete === false) {
    return;
  }
  database
    .from("rooms")
    .select("id, created_by")
    .eq("room_name", roomToDelete)
    .then(function (response) {
      if (response.error) {
        console.log(response.error);
        return;
      }
      if (response.data.length !== 1) {
        alert("Room not found or room name is not unique!");
        return;
      }
      let room = response.data[0];
      if (room.created_by !== userId) {
        alert("You can only delete rooms created by you!");
        return;
      }
      database
        .from("messages")
        .delete()
        .eq("room", roomToDelete)
        .then(function (messageResponse) {
          if (messageResponse.error) {
            console.log(messageResponse.error);
            alert("Could not delete messages!");
            return;
          }
          database
            .from("rooms")
            .delete()
            .eq("id", room.id)
            .eq("created_by", userId)
            .select("id")
            .then(function (deleteResponse) {
              if (deleteResponse.error) {
                console.log(deleteResponse.error);
                alert("Room deletion failed!");
                return;
              }
              if (deleteResponse.data.length === 0) {
                alert("You are not allowed to delete this room!");
                return;
              }
              alert("Room deleted successfully!");
              deleteRoomBtn.style.display = "none";
              showRoomsPage();
              loadRooms();
            });
        });
    });
});
