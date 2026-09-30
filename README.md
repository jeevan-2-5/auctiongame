# Cricket Auction Arena

A complete, production-quality multiplayer cricket auction arena and squad simulation game. Friends can create private or public auction rooms, join remotely via 6-character room codes or shareable links, draft real cricket superstars against each other in real-time, build a squad of **strictly up to 15 players per franchise**, select their Playing XI & batting order (1-11), and receive deterministic ratings paired with Gemini AI scouting reports and championship coronation.

---

## 1. Core Features

- **Multiplayer Auction Rooms**:
  - Instant room creation with custom 6-character codes (e.g. `A7K92P`).
  - Anonymous session management — no mandatory account creation required.
  - Reconnection resilience: automatically restores user identity, team, squad, and purse on browser refresh.
  - Spectator mode support for passive observers.

- **10 Franchise Identities**:
  - RCB (Bengaluru Challengers), CSK (Chennai Super Kings), MI (Mumbai Indians), KKR (Kolkata Knight Riders), SRH (Sunrisers Hyderabad), RR (Rajasthan Royals), DC (Delhi Capitals), GT (Gujarat Titans), LSG (Lucknow Super Giants), PBKS (Punjab Kings).
  - Unique badges, city branding, stadium colors, and owner assignment locking.

- **Server-Authoritative Real-Time Bidding**:
  - WebSocket-powered instant bid broadcasts and timer synchronization.
  - 10-second authoritative countdown timer that resets to 5 seconds upon valid bids.
  - Dynamic bid increments: +₹5 Lakh (< ₹1 Cr), +₹10 Lakh (₹1-5 Cr), +₹25 Lakh (> ₹5 Cr).
  - All monetary values stored as integer lakhs to completely eliminate floating-point rounding errors.

- **Strict 15-Player Squad Rule**:
  - Every team has a hard cap of **exactly/up to 15 players**.
  - Once a squad reaches 15 players, the server authoritatively disables bidding, locks the team, and shows `SQUAD FULL (15/15)`.

- **Comprehensive Real Player Database**:
  - 50+ authentic international & domestic cricketers (Virat Kohli, Rohit Sharma, Jasprit Bumrah, Pat Cummins, Heinrich Klaasen, Nicholas Pooran, Rashid Khan, Hardik Pandya, etc.).
  - Phase ratings: Powerplay batting/bowling, Middle-overs spin/pace, Death-overs clutch execution, Fielding, and Wicketkeeping.
  - Categorized into sets: Marquee Batters, Marquee Bowlers, Premier All-Rounders, Wicketkeepers, Fast Bowlers, Spinners, Emerging Talents.
  - CSV export & import tools for custom rosters.

- **Playing XI Studio**:
  - Pick exactly 11 players from the 15-player squad (remaining 4 become substitutes on the bench).
  - Arrange batting order from #1 to #11 with accessible Up/Down buttons or one-click auto-suggest.
  - Nominate Captain [C] and Vice Captain [VC].
  - Real-time validation for overseas limits (maximum 4 overseas in Playing XI) and specialist roles.

- **Deterministic Scoring Engine & Gemini AI**:
  - 100% reproducible mathematical scoring model:
    - Batting Strength: 25%
    - Bowling Strength: 25%
    - All-Round Balance: 15%
    - Role Composition: 10%
    - Powerplay Phase: 5%
    - Middle Overs: 5%
    - Death Overs: 5%
    - Fielding: 5%
    - Bench Strength: 5%
  - Gemini AI (`gemini-3.8-flash`) produces natural language scouting reports, tactical matchup evaluations, and championship coronation speeches without altering the deterministic numerical winner.
  - Head-to-Head simulated matchup engine between any two drafted franchises.

- **Audio Feedback & Celebrations**:
  - Web Audio API synthesized hammer strike, live bid chimes, timer countdown warning, and victory fanfares (with mute toggle).
  - Confetti fireworks on championship podium.

---

## 2. Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Motion, Lucide Icons, Canvas Confetti.
- **Backend**: Node.js 22, Express 4, `ws` (WebSockets), TypeScript (`tsx`).
- **AI Service**: Google GenAI SDK (`@google/genai`) using `gemini-3.8-flash`.
- **Build & Dev Tooling**: Vite 8, TypeScript 7.

---

## 3. Project Structure

```
├── .env.example                  # Environment configuration template
├── metadata.json                 # AI Studio app metadata
├── index.html                    # Application HTML entry point
├── package.json                  # Dependencies and scripts
├── server.ts                     # Full-stack Express + WebSocket server
├── tsconfig.json                 # TypeScript compiler configuration
├── vite.config.ts                # Vite build configuration
├── tests/
│   └── auction.test.ts           # Unit tests for bidding, rules, and scoring
├── src/
│   ├── App.tsx                   # Main application router and state coordinator
│   ├── index.css                 # Global styling and Tailwind directives
│   ├── main.tsx                  # React DOM entry point
│   ├── types/
│   │   └── auction.ts            # Shared TypeScript interfaces & types
│   ├── data/
│   │   ├── teams.ts              # 10 Cricket franchise metadata & themes
│   │   └── players.ts            # 50+ Real player database with phase ratings
│   ├── hooks/
│   │   └── useAuctionSocket.ts   # Client WebSocket communication hook
│   ├── utils/
│   │   ├── session.ts            # Anonymous session ID & state persistence
│   │   └── soundEffects.ts       # Web Audio API sound synthesizer
│   ├── server/
│   │   ├── auctionManager.ts     # Authoritative auction rooms & state machine
│   │   ├── scoringEngine.ts      # Deterministic mathematical scoring engine
│   │   └── aiService.ts          # Gemini AI scouting report generator
│   └── components/
│       ├── Navbar.tsx            # 3-Zone top navigation header
│       ├── HeroSection.tsx       # Landing showcase & quick actions
│       ├── CreateRoomModal.tsx   # Custom room setup modal
│       ├── JoinRoomModal.tsx     # 6-character room code entry modal
│       ├── BrowseRoomsView.tsx   # Public rooms directory
│       ├── WaitingLobby.tsx      # Pre-auction lobby & team selection
│       ├── PlayerCard.tsx        # Live player card with phase attributes
│       ├── BidDesk.tsx           # Bidding desk, timer, and squad cap banner
│       ├── Leaderboard.tsx       # Real-time standings of all 10 franchises
│       ├── ActivityFeed.tsx      # Real-time event wire
│       ├── HostControlsBar.tsx   # Floating auctioneer console
│       ├── SquadModal.tsx        # 15-player squad inspection drawer
│       ├── PlayingXIBuilder.tsx  # Batting order studio & captaincy selector
│       ├── AnalysisView.tsx      # Champion podium & Head-to-Head simulator
│       ├── PlayerDatabaseView.tsx# Searchable database & CSV import/export
│       └── RulesModal.tsx        # Tournament constitution modal
```

---

## 4. Setup & Local Development

### Prerequisites
- Node.js >= 20 (Node 22 recommended)
- npm >= 9

### Installation
```bash
npm install
```

### Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure your `GEMINI_API_KEY` is provided if you want live AI commentary generation. (If omitted, the app automatically uses the built-in deterministic tactical explanation generator without crashing).

### Running Locally
```bash
npm run dev
```
The server will start on `http://localhost:3000`.

### Running Tests
```bash
npm run test
```
Executes the test suite verifying room creation, team locking, dynamic bid increments, 15-player squad cap enforcement, and deterministic score reproducibility.

### Building for Production
```bash
npm run build
npm start
```

---

## 5. Realtime Architecture

1. **State Authoritative Server**:
   The Express server mounts a WebSocket server at `/ws` using the `ws` package. All room state mutations (bids, player transitions, squad additions, timer resets) are validated and broadcast from the server.
2. **Subscription Model**:
   Clients connect and send a `SUBSCRIBE` packet with their `roomId` and `sessionId`. The server pushes initial room state (`ROOM_STATE`) and streams delta updates (`ROOM_UPDATE`) whenever bids or clock ticks occur.
3. **Reconnection & Resilience**:
   Player sessions are tracked using persistent anonymous IDs stored in localStorage. If a user refreshes or disconnects, re-connecting to the same room restores their franchise ownership, purse balance, and purchased players seamlessly.

---

## 6. Deterministic AI Scoring Model

The winning team is calculated using a 100% reproducible weighted model:
```
Overall Score = (Batting * 0.25)
              + (Bowling * 0.25)
              + (All-Round Balance * 0.15)
              + (Role Composition * 0.10)
              + (Powerplay Phase * 0.05)
              + (Middle Overs * 0.05)
              + (Death Overs * 0.05)
              + (Fielding * 0.05)
              + (Bench Strength * 0.05)
```
- **Batting Score**: Weighted by batting order positions (#1-#2 Openers: 30%, #3-#4 Top order: 30%, #5-#7 Middle order: 30%, #8 Anchor: 10%). Captain & Vice-Captain receive leadership bonuses.
- **Bowling Score**: Evaluates top 5 frontline bowling ratings plus depth of 6th bowling option.
- **Role Composition**: Penalizes lack of specialist wicketkeeper (-15), fewer than 2 specialist pacers (-8), lack of spin options (-8), or illegal overseas counts (>4 overseas: -20).
- **Gemini AI**: Takes these deterministic ratings and produces rich, broadcast-quality scouting reports, phase breakdowns, and celebration commentary.
