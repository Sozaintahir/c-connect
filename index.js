console.log("working");
const database = supabase.createClient(
  "https://qinwxytxuqjvzvxjflii.supabase.co",
  "sb_publishable_mc3xj_FFxm81KEzal2ONvw_wpUCEdx4",
);
const nameInput = document.querySelector("#nameInput");
const enterBtn = document.querySelector("#enterBtn");
const messageInput = document.querySelector("#messageInput");
const sendBtn = document.querySelector("#sendBtn");
const nameScreen = document.querySelector("#nameScreen");
const chatScreen = document.querySelector("#chatScreen");
const list = document.querySelector("#list");
let username = "";
const channel = database.channel("room1", {
  config: {
    private: false,
  },
});
channel
  .on("broadcast", { event: "message_sent" }, (payload) => {
    createUI({
      text: payload.payload.text + " :-> " + payload.payload.user,
    });
  })
  .subscribe();
enterBtn.addEventListener("click", function () {
  username = nameInput.value;
  if (username === "") {
    alert("Please enter your name");
    return;
  }
  nameScreen.style.display = "none";
  chatScreen.style.display = "block";
});
sendBtn.addEventListener("click", function () {
  let message = messageInput.value;
  if (message === "") {
  alert("Please enter a message");
  return;
}
  createUI({text: message + " :-> " + username,});
  channel.send({
    type: "broadcast",
    event: "message_sent",
    payload: {
      text: message,
      user: username,
    },
  });
    messageInput.value = "";
});
function createUI(obj) {
  let li = document.createElement("li");
  li.innerText = obj.text;
  list.appendChild(li);
} 