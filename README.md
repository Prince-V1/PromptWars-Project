# FoodLoop — PromptWars Project
## Intelligent Real-Time Food Rescue & Surplus Redistribution Ecosystem
> **Live Production Deployment:** [https://foodloop-vert.vercel.app](https://foodloop-vert.vercel.app)  
> **Tagline:** Save Food • Share Food • Feed Better  
> **Market Focus:** Pan-India (Delhi NCR Pilot Hubs) • **Currency:** INR (₹) • **Standards:** FSSAI & AWBI Compliant

---

## 1. Executive Summary & Problem Statement

### The Real-Life Crisis in India: Food Waste vs. Widespread Hunger
India produces enough food to feed its entire population, yet it grapples with a tragic, structural paradox:
- **68.8 Million Tonnes** of food is wasted annually in India, valued at over **$14 Billion (₹1.1 Lakh Crore)** according to UNEP Food Waste Index reports.
- **Rank 105 out of 127 countries** on the Global Hunger Index (2024), with over **200 million citizens** suffering from chronic undernourishment and food insecurity.
- **High-Volume Point Sources:** Indian weddings, banquet celebrations, luxury hotels, corporate conventions, and catering businesses prepare vast buffers (20% to 35% excess). Following an event, pristine, safe, untouched food is routinely discarded into municipal dumpsters due to:
  1. *High Logistical Friction:* Organizers lack rapid, pre-vetted channels to report food with guaranteed pickup in < 3 hours.
  2. *Safety Verification Gaps:* Fear of food liability and lack of cold/hot-holding chain temperature audits.
  3. *Zero Animal Care Routing:* Clean raw vegetable peels, fruit trimmings, safe whole grains, and day-old bakery crusts are mixed with toxic municipal trash instead of feeding thousands of rescued cows in Gaushalas and recovering dogs in animal shelters.
- **Climate Degradation:** Decomposing food in open Indian landfills generates massive volumes of methane ($CH_4$), contributing to 8–10% of total global greenhouse gas emissions.

### The FoodLoop Mission
**FoodLoop** is an AI-powered, real-time surplus food redistribution infrastructure built specifically to solve this crisis. By combining **Google Gemini AI visual recognition**, a **deterministic multi-factor decay algorithm**, and **strict beneficiary segregation (Human Food Relief vs. Animal Care Sanctuaries)**, FoodLoop transforms edible surplus into immediate community nourishment within minutes.

---

## 2. Core Architectural Pillars & Features

```
+-----------------------------------------------------------------------------------+
|                               FOODLOOP PLATFORM                                   |
+-----------------------------------------------------------------------------------+
       |                                                               |
+---------------+                                             +-----------------+
| FOOD PROVIDER |                                             | RECIPIENTS &    |
| ECOSYSTEM     |                                             | SANCTUARIES     |
| - Hotels      |                                             | - Food Banks    |
| - Banquets    |                                             | - Night Shelters|
| - Weddings    |                                             | - Gaushalas 🐾  |
| - Restaurants |                                             | - Shelters 🐕   |
+---------------+                                             +-----------------+
       |                                                               ^
       v                                                               |
+-------------------------------------------------------------------------------+
| AI & VERIFICATION CORE ENGINE                                                 |
| - Google Gemini Vision: Container, Condition & Visual Freshness Assessment   |
| - Nouriq AI Assistant: Logistics, Categorization & FSSAI Guidance             |
| - Deterministic Decay Engine: Multi-factor Priority Urgency Scoring           |
| - Strict Beneficiary Segregator: Human Relief vs. Species-Safe Animal Feed   |
| - Hyperlocal Haversine Engine: Live GPS & 8 Delhi NCR Geographic Hubs         |
+-------------------------------------------------------------------------------+
```

### A. Dedicated Food Provider Ecosystem
Supports specialized profiles and tailored donation workflows for:
1. **Wedding Venues & Banquets** (Surplus buffet trays, sealed handis)
2. **Wedding Planners & Event Organizers** (Pre-scheduled rescue registrations)
3. **5-Star & Heritage Hotels** (Daily kitchen surplus, bakery batches)
4. **Restaurants & Cloud Kitchens** (Cooked meals, quick perishable batches)
5. **Catering Companies** (Bulk stainless-steel chafing dish surplus)
6. **Bakeries & Confectioneries** (Day-old breads, whole wheat rotis, naans)
7. **Grocery Stores & Wholesale Markets** (Fresh produce crates, packaged staples)

### B. Foodloop Event Rescue
A dedicated post-event food rescue protocol allowing organizers to:
- **Register Upcoming Events:** Set guest count, banquet hall, expected categories, and standby notification.
- **Instant Surplus Reporting:** Enter batch details post-event with mandatory **Food Safety Attestation** (untouched vs. guest-exposed, storage temperature in °C, holding conditions).
- **Fast-Track Dispatch:** Immediate broadcast to high-capacity night shelters and partner distribution vans.

### C. Animal Care Organizations & Recipient Sanctuaries
A world-first, segregated non-human food relief portal keeping human food recipients and animal welfare organizations cleanly separated:
- **Supported Organization Types:**
  1. *Gaushala* (Indigenous cattle and draught bull sanctuaries)
  2. *Animal Shelter* (Rescued dogs, puppies, and injured street strays)
  3. *Animal Rescue Centre* (Trauma recovery and wild avian hospital)
  4. *Veterinary Hospital* (Post-operative care and medical recovery feeding)
  5. *Animal Welfare NGO* (Community street-feeder distribution networks)
  6. *Livestock Care Centre* (Working equines, rescued goats, and sheep)
- **Species-Specific Multi-Select:** Cattle (`cows`, `bulls`, `buffaloes`), Canines (`dogs`), Felines (`cats`), Small Ruminants (`goats`, `sheep`), and Avian (`birds`).
- **Species-Safe Feed Checks:** Strict rejection of toxic alliums (onions, garlic) and chocolates for canines; strict vegetarian, plastic-free raw fodder verification for ruminants.

### D. Algorithmic Priority & Urgency Scoring
FoodLoop replaces guesswork with a deterministic decay algorithm that calculates priority score ($S \in [0, 100]$):

$$S = \text{clamp}\left( w_t \cdot \left(1 - \frac{\Delta t}{T_{max}}\right) + w_c \cdot K_{category} + w_q \cdot \log_{10}(Q + 1) + w_s \cdot M_{storage}, 0, 100 \right)$$

- **$\Delta t$:** Hours remaining until pickup deadline.
- **$K_{category}$:** Perishability factor (`cooked_meals`: 1.0, `fresh_produce`: 0.7, `bakery`: 0.5, `packaged_groceries`: 0.2).
- **$M_{storage}$:** Thermal safety multiplier (`hot_holding` $\ge 60^\circ\text{C}$: 1.2, `refrigerated` $\le 5^\circ\text{C}$: 0.8, `room_temperature`: 1.5).

### E. Hyperlocal Proximity Dispatch across 8 Hubs
Dynamic Haversine distance engine calculates point-to-point transit mileage across 8 major pilot hubs:
- **Connaught Place** (Central Delhi)
- **Diplomatic Enclave, Chanakyapuri** (South-Central Delhi)
- **Khan Market & Lodhi Colony** (South Delhi)
- **Hauz Khas & Green Park** (South Delhi)
- **Paharganj & New Delhi Railway Station** (Central Delhi)
- **Civil Lines & North Campus** (North Delhi)
- **DLF Cyber City & Phase 2** (Gurugram / NCR)
- **Sector 18 & Atta Market** (Noida / NCR)

---

## 3. Technology Stack

### Frontend
- **Framework:** Next.js 15.1 (React 19, App Router)
- **Language:** TypeScript 5.9 (Strict Type Safety)
- **Styling:** Custom Tailwind CSS 3.4 (FoodLoop Design System)
- **Icons:** Lucide React Icons
- **Mapping:** Leaflet & OpenStreetMap (Interactive toggle view)
- **State & Form Management:** React Hook Form + Zod Schema Validation

### Backend
- **Framework:** FastAPI (Python 3.11 / 3.14)
- **ORM & DB:** SQLAlchemy 2.0 (Async Engine) with SQLite / Supabase PostgreSQL
- **Security:** Argon2 / PBKDF2 Password Hashing, JWT Bearer Token Authentication, Role-Based Access Control (RBAC)
- **AI Vision & Chat:** Google Gemini API (Multimodal Vision & Nouriq AI Assistant)

---

## 4. Food Safety & Regulatory Compliance

1. **FSSAI 4-Hour Rule:** Perishable cooked foods held at ambient temperatures must be distributed within 4 hours of preparation.
2. **Untouched Guarantee:** Food served on self-serve guest plates is strictly prohibited from redistribution; only untouched, temperature-maintained chafing dish reserves are eligible for human relief.
3. **Animal Feed Protocol:** Mandates 100% absence of food packaging, plastic film, toothpicks, spices, or species toxins before dispatch.

---

## 5. Local Setup & Installation

### Prerequisites
- Node.js 18+ & npm
- Python 3.10+
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/prince-v1/AI-VIBEATHON.git
cd AI-VIBEATHON
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python -m uvicorn app.main:app --port 8000 --reload
```
The FastAPI backend will automatically initialize the database and seed demo listings across all 8 Delhi NCR hubs.

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run build
npm start
```
Open [http://localhost:3000](http://localhost:3000) in your browser. By default, FoodLoop opens directly to the **Explore Surplus Food** discovery portal.

---

## 6. Real-World Impact Metrics (UNEP Standards)
- **Meals Saved Formula:** $1\text{ kg food} = 2.5\text{ standard 400g nutritious meals}$.
- **GHG Emissions Offset:** $1\text{ kg food diverted from landfill} = 2.5\text{ kg CO}_2\text{ equivalent avoided}$.
- **Social Return:** Real-time impact ledger tracking total kilograms rescued, meals served to vulnerable communities, and animal feed supplied to Gaushalas and rescue shelters.

---

## 7. License & Hackathon Submission
Built with heart for the **AI VIBEATHON Hackathon**.  
Released under the [MIT License](LICENSE).
