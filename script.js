let activeRegionId = null;

let wavesurfer;
let loadedAudioFile = null;
let loadedAudioFilename = "Extract";
const comments = [];
let editingIndex = null;
let isLoadingProject = false;
const regionColor = "rgba(100, 149, 237, 0.2)";
const categoryOptions = [
  "Instrumentation",
  "Texture",
  "Timbre",
  "Tonality",
  "Harmony",
  "Rhythmic Techniques",
  "Structure/Form",
  "Melodic Techniques",
  "Production",
];

function initWaveSurfer() {
  wavesurfer = WaveSurfer.create({
    container: "#waveform",
    waveColor: "#555",
    progressColor: "#4a90e2",
    cursorColor: "#ff4081",
    height: 200,
    barWidth: 1,
    responsive: true,
    plugins: [
      WaveSurfer.regions.create(),
      WaveSurfer.timeline.create({ container: "#timeline" }),
    ],
  });

  // Attach your handlers
  wavesurfer.on("region-created", onRegionCreated);
  wavesurfer.on("play", () => {
    document.getElementById("playPauseBtn").textContent = "Pause";
  });

  wavesurfer.on("pause", () => {
    document.getElementById("playPauseBtn").textContent = "Play";
  });

  // ✅ Add loop toggle listener here
  wavesurfer.on("region-out", (region) => {
    if (loopEnabled && region.id === activeRegionId) {
      wavesurfer.play(region.start);
    }
  });

  window.wavesurfer = wavesurfer;
}

initWaveSurfer();

function onRegionCreated(region) {
  if (isLoadingProject) return;
  if (region.start === region.end) return region.remove();

  const id = "comment-" + Date.now();
  region.id = id;
  region.update({ color: regionColor, drag: true, resize: true });

  // 💡 Apply handle styling
  region.element.querySelectorAll(".wavesurfer-handle").forEach((handle) => {
    handle.style.width = "1px";
    handle.style.backgroundColor = "#333";
  });

  comments.push({
    id,
    start: region.start,
    end: region.end,
    category: "",
    text: "",
  });

  editingIndex = comments.length - 1;
  updateCommentList();
}

document.getElementById("audioFile").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  clearAll(() => {
    loadedAudioFile = file;
    loadedAudioFilename = file.name.replace(/\.[^/.]+$/, "");

    const url = URL.createObjectURL(file);
    wavesurfer.load(url);

    wavesurfer.once("ready", () => {
      wavesurfer.enableDragSelection({ color: regionColor });
    });
  });
});

document.getElementById("loadZip").addEventListener("change", async (e) => {
  const files = Array.from(e.target.files);
  if (files.length !== 2) {
    alert("Please select *both* your .mp3 and .json project files.");
    return;
  }

  const mp3File = files.find(f => f.name.toLowerCase().endsWith(".mp3"));
  const jsonFile = files.find(f => f.name.toLowerCase().endsWith(".json"));

  if (!mp3File || !jsonFile) {
    alert("You need to select both a .mp3 file and a .json file.");
    return;
  }

  const confirmClear = confirm(
    "Are you sure you want to clear the current audio and all comments?"
  );
  if (!confirmClear) return;

  // Clear current state
  clearAll(async () => {
    loadedAudioFile = mp3File;
    loadedAudioFilename = mp3File.name.replace(/\.[^/.]+$/, ""); // strip extension

    const url = URL.createObjectURL(mp3File);
    wavesurfer.load(url);

    // Read the JSON file
    const jsonText = await jsonFile.text();
    const parsedComments = JSON.parse(jsonText);

    wavesurfer.once("ready", () => {
      isLoadingProject = true;
      comments.length = 0;
      parsedComments.forEach((c) => comments.push(c));

      // Recreate regions
      setTimeout(() => {
        parsedComments.forEach((c) => {
          const region = wavesurfer.addRegion({
            id: c.id,
            start: c.start,
            end: c.end,
            color: regionColor,
            drag: true,
            resize: true,
          });

          // Resize handle styling
          region.element
            .querySelectorAll(".wavesurfer-handle")
            .forEach((handle) => {
              handle.style.width = "1px";
              handle.style.backgroundColor = "#333";
            });
        });

        isLoadingProject = false;
        updateCommentList();
        wavesurfer.enableDragSelection({ color: regionColor });
      }, 100);
    });
  });
});


function clearAll(callbackAfterReset = null) {
  if (wavesurfer) wavesurfer.destroy();

  comments.length = 0;
  editingIndex = null;
  loadedAudioFile = null;
  loadedAudioFilename = "Extract";

  document.getElementById("commentList").innerHTML = "";
  document.getElementById("playPauseBtn").textContent = "Play";
  document.getElementById("audioFile").value = "";
  document.getElementById("timeline").innerHTML = "";
  document.getElementById("waveform").innerHTML = "";

  setTimeout(() => {
    initWaveSurfer();
    if (typeof callbackAfterReset === "function") callbackAfterReset();
  }, 100);
}

function downloadProjectZip() {
  if (!loadedAudioFile) {
    alert(
      "No audio file loaded. Please load an MP3 before saving the project."
    );
    return;
  }

  document.getElementById("projectNameInput").value = "";
  document.getElementById("saveProjectModal").style.display = "flex";
  document.getElementById("projectNameInput").focus();
}

document.getElementById("playPauseBtn").onclick = () => {
  if (wavesurfer) wavesurfer.playPause();
};

document.addEventListener("keydown", (e) => {
  if (
    e.code === "Space" &&
    !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)
  ) {
    e.preventDefault();
    if (wavesurfer) wavesurfer.playPause();
  }
});

function updateCommentList() {
  const list = document.getElementById("commentList");
  list.innerHTML = comments
    .map((c, i) => {
      if (editingIndex === i) {
        return `
        <div class="comment-item">
          <strong>${i + 1}</strong><br/>
          Feature
          <select id="editCategory${i}">
  <option value="" disabled ${
    !c.category ? "selected" : ""
  }>Choose a feature...</option>
  ${categoryOptions
    .map(
      (opt) =>
        `<option value="${opt}" ${
          c.category === opt ? "selected" : ""
        }>${opt}</option>`
    )
    .join("")}
</select><br/>
          Comment:<br/>
          <textarea id="editText${i}" rows="4">${c.text}</textarea><br/>
          <button onclick="saveEdit(${i})">Save</button>
          <button onclick="deleteComment(${i})">Delete</button>
        </div>`;
      } else {
        return `
  <div class="comment-item" onclick="seekToRegion('${c.id}')">
    <div class="comment-content">
<span class="feature-label">${c.category || "Feature"}</span><br/><br/>
      ${c.text}
    </div>
    <div class="comment-buttons">
      <button onclick="editComment(${i}); event.stopPropagation()">Edit</button>
      <button onclick="deleteComment(${i}); event.stopPropagation()">Delete</button>
    </div>
    <div class="comment-number"> ${i + 1}</div>
  </div>`;
      }
    })
    .join("");
}

function seekToRegion(id) {
  const r = wavesurfer.regions.list[id];
  if (r) {
    activeRegionId = id;
    wavesurfer.play(r.start);
  }
}

function editComment(i) {
  editingIndex = i;
  updateCommentList();
}

function saveEdit(i) {
  comments[i].text = document.getElementById("editText" + i).value;
  comments[i].category = document.getElementById("editCategory" + i).value;
  editingIndex = null;
  updateCommentList();
}

function deleteComment(i) {
  const id = comments[i].id;
  wavesurfer.regions.list[id]?.remove();
  comments.splice(i, 1);
  updateCommentList();
}

async function exportExtracts() {
  if (!loadedAudioFile) {
    alert("Load an MP3 first.");
    return;
  }

  const arrayBuffer = await loadedAudioFile.arrayBuffer();
  const ctx = new AudioContext();
  const buffer = await ctx.decodeAudioData(arrayBuffer);
  const log = [];

  for (let i = 0; i < comments.length; i++) {
    const c = comments[i];
    const region = wavesurfer.regions.list[c.id];
    if (!region) continue;

    const sr = buffer.sampleRate;
    const s = Math.floor(region.start * sr);
    const e = Math.floor(region.end * sr);
    const length = e - s;

    if (length <= 0) continue;

    const raw = buffer.getChannelData(0).slice(s, e);
    const pcm = new Int16Array(raw.length);
    for (let j = 0; j < raw.length; j++) {
      pcm[j] = raw[j] * 32767;
    }

    const enc = new lamejs.Mp3Encoder(1, sr, 128);
    const mp3 = [];

    for (let j = 0; j < pcm.length; j += 1152) {
      const chunk = pcm.subarray(j, j + 1152);
      const buf = enc.encodeBuffer(chunk);
      if (buf.length) mp3.push(new Uint8Array(buf));
    }

    const flush = enc.flush();
    if (flush.length) mp3.push(new Uint8Array(flush));

    const blob = new Blob(mp3, { type: "audio/mp3" });
    const safeCategory = c.category || "Uncategorized";
    const filename = `${loadedAudioFilename} - Extract ${
      i + 1
    } - ${safeCategory}.mp3`;
    saveAs(blob, filename);

    log.push(`${filename}\nFeature: ${safeCategory}\nComment: ${c.text}\n`);
  }

  const textBlob = new Blob([log.join("\n")], { type: "text/plain" });
  saveAs(textBlob, `${loadedAudioFilename} - Extract_Comments.txt`);
  showDownloadModal();
}
let loopEnabled = false;

function toggleLoop() {
  loopEnabled = !loopEnabled;
  document.getElementById("toggleLoopBtn").textContent = `Loop: ${
    loopEnabled ? "On" : "Off"
  }`;
}
function confirmAndClear() {
  const confirmed = confirm(
    "Are you sure you want to clear the current audio and all comments?"
  );
  if (confirmed) {
    clearAll();
  }
}

function showDownloadModal() {
  document.getElementById("downloadModal").style.display = "flex";
}

function closeDownloadModal() {
  document.getElementById("downloadModal").style.display = "none";
}

function closeSaveProjectModal() {
  document.getElementById("saveProjectModal").style.display = "none";
}

function submitProjectName() {
  const name = document.getElementById("projectNameInput").value.trim();
  if (!name) {
    alert("Please enter a project name.");
    return;
  }

  closeSaveProjectModal();

  // Update region timings before saving
  const updated = comments.map((c) => {
    const region = wavesurfer.regions.list[c.id];
    return {
      ...c,
      start: region ? +region.start.toFixed(3) : c.start,
      end: region ? +region.end.toFixed(3) : c.end,
    };
  });

  // ⬇️ 1. Save JSON File
  const jsonBlob = new Blob([JSON.stringify(updated, null, 2)], {
    type: "application/json",
  });
  const jsonFilename = `${name} - Comments.json`;
  saveAs(jsonBlob, jsonFilename);

  // ⬇️ 2. Save MP3 File (original audio)
  if (loadedAudioFile) {
    const ext = loadedAudioFile.name.split(".").pop();
    const audioFilename = `${name} - Audio.${ext}`;
    saveAs(loadedAudioFile, audioFilename);
  } else {
    alert("No audio file loaded.");
  }
}
