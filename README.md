# 🎵 Waveform Commenter

A web-based tool for uploading and annotating MP3 audio files with region-based comments. Designed for music educators, students, and analysts who need to identify and discuss specific musical features.

## ✨ Features

- Upload an MP3 and view its waveform
- Select regions of the waveform and add comments
- Categorize comments by musical feature (e.g. Timbre, Texture, Structure)
- Export:
  - Extracted audio regions as individual MP3s
  - A text file of all comments
- Save and reload complete projects as ZIP files
- Toggle looping of regions
- Keyboard shortcuts:  
  - `Space` = Play/Pause  
  - Modal interface for saving projects

## 📦 Usage

1. Click **Load MP3** and select an audio file
2. Click and drag on the waveform to create a comment region
3. Choose a feature and write your comment
4. Save your project or export regions with comments

## 💾 Project Files

You can:
- **Save your session** as a `.zip` (includes audio + JSON data)
- **Reload saved projects** and continue working

## 🚀 Getting Started

To run locally:

```bash
git clone https://github.com/your-username/waveform-commenter.git
cd waveform-commenter
open index.html
