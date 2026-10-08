# 🌐 SocialConnect - Full Stack Social Media Platform

**SocialConnect** ek modern, feature-rich, aur fully responsive social media web application hai. Is project ka maqsad users ko ek interactive platform faraham karna hai jahan wo connect kar sakein, apni life updates share karein, aur ek doosre ki posts ko like aur comment kar sakein.

---

## ✨ Key Features

- 🔐 **Secure Authentication:** JWT (JSON Web Tokens) aur Bcrypt hashing ke zariye secure Login aur Registration system.
- 👤 **Dynamic User Profiles:** Users apni Profile Picture, Cover Banner, aur Bio ko easily edit aur upload kar sakte hain.
- 📝 **Rich Posts:** Text aur Images ke sath posts create karein (Multer integration).
- ❤️ **Real-time Interactions:** Posts ko Like/Unlike karein aur Comments add/delete karein.
- 🔍 **Smart Search:** Users ko unke username ke zariye real-time search karein.
- 🤝 **Facebook-Style Feed:** Dynamic feed algorithm. Aapko sirf unhi logon ki posts dikhengi jinhe aap follow karte hain.
- 🗑️ **Content Management:** Secure authorization - users sirf apni khud ki posts aur comments delete kar sakte hain.

---

## 🛠️ Tech Stack

### Frontend
- **React.js** (UI Library)
- **Tailwind CSS** (Modern Styling)
- **Axios** (HTTP Requests)
- **React Router** (Client-side Navigation)

### Backend
- **Node.js** & **Express.js** (RESTful API)
- **MySQL** (Relational Database)
- **JWT** (Authentication & Security)
- **Bcrypt.js** (Password Hashing)
- **Multer** (Image/File Uploads)

---

## 🚀 Installation & Setup Guide

Is project ko apne local machine par chalane ke liye neeche diye gaye steps follow karein:

### 1. Prerequisites
- [Node.js](https://nodejs.org/) installed hona chahiye.
- [XAMPP](https://www.apachefriends.org/) ya koi bhi MySQL server chal raha hona chahiye.

### 2. Database Setup
- `phpMyAdmin` kholain aur ek naya database banayein (e.g., `socialconnect_db`).
- Apne database mein ye tables create karein: `users`, `posts`, `comments`, `likes`, `follows`.

### 3. Backend Setup
```bash
# Backend folder mein jayen
cd backend

# Dependencies install karein
npm install

# .env file banayein aur apni DB credentials add karein
node index.js
