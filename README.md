# SPAR SaveMor POSM Tracker

A web application built with **Node.js (Express)**, **SQLite**, and **React (Vite)** based on the SPAR Sri Lanka POSM Tracking Proposal.

> **"Track · Issue · Confirm · Together"**

---

## 🌟 Overview & Key Features

This application replaces Excel sheets (`SAVEMOR HOARDING SIZES`) with a real-time, shared calendar system connecting **SPAR Marketing** and all **22 IR (SaveMor) Branches** across Sri Lanka:

1. **Role-Based Permissions (3 Roles)**:
   - **Admin (Marketing)**: Full master data management (branches, hoarding slots, item types, sizes), single and bulk POSM item issuing, status updates, reports, user accounts, and system settings.
   - **User (Marketing / Management)**: View calendar, search, view reports, and export to Excel.
   - **IR Branch (Store User)**: Strictly isolated login linked to one branch record. Server validates and restricts queries so branches can never view other branches' data. Branches confirm receipts (**Mark Received**) or report issues (**Problem**).

2. **Core Workflow & Status Flow (5 States)**:
   - **Grey (Pending)**: Planned in calendar, not dispatched yet.
   - **Blue (Issued)**: Dispatched by marketing, waiting for branch receipt.
   - **Green (Received)**: Branch confirmed receipt.
   - **Red (Problem / Overdue)**: Damaged/wrong size/missing OR not confirmed by the **2nd day of the following month** (e.g. issued 27 Jun $\rightarrow$ red from 2 Jul).
   - **Cancelled**: Cancelled by Admin with audit log note.

3. **Pre-Seeded Master Data**:
   - **22 SaveMor Branches**: Chandra Super (Palmadulla), SaveMor City (Colombo), Galle, Kandy, Matara, Kurunegala, Negombo, Gampaha, Kalutara, Ratnapura, Anuradhapura, Badulla, Kegalle, Panadura, Wattala, Moratuwa, Battaramulla, Maharagama, Kiribathgoda (Branch A & B), Nugegoda, and Bandarawela.
   - **Hoarding Slots**: Physical billboard specifications (e.g., Chandra Super's 12'x8' horizontal hoarding + 2 nos of 8'x4' vertical).
   - **POSM Item Types**: Tabloid, Poster, Hoarding, Banner, Wobbler, etc.
   - **Audit Trail (`issue_updates`)**: Full immutable history tracking who updated each status and when.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### Running Locally

To run both the **Backend API** and **Frontend Web Application** concurrently:

```bash
# In the project root (e:\Spar IR):
npm run dev
```

- **Frontend App**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:5000](http://localhost:5000)

---

## 🔑 Demo Accounts (1-Click Login Available)

All demo accounts use password: `spar123`

| Role | Username | Description |
| :--- | :--- | :--- |
| **Admin (Marketing)** | `admin` | Sanith Perera — Full administrative access & issuing |
| **Marketing / Mgmt** | `user` | Nimal Perera — Global calendar view & Excel reports |
| **Branch User 1** | `chandrasuper` | Chandra Super (Palmadulla) store representative |
| **Branch User 2** | `savemorcity` | SaveMor City (Colombo) store representative |
| **All other 20 Branches** | e.g. `gallebranch`, `kandybranch` | Isolated single-branch logins for all 22 stores |

> 💡 **Tip:** The top navigation bar includes a **"Switch Role"** button to toggle between any account in 1 click for seamless testing!
