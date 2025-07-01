# MKWLog - Mario Kart World Time Tracker

**Live App:** [https://mkwlog.com](https://mkwlog.com)

MKWLog is a web application for tracking your Mario Kart World time attack progress. Record lap times, manage character/vehicle combinations, and analyze your racing performance across all circuits.

## Features

- Track time attack records for all Mario Kart World circuits
- Character and vehicle combination management
- Performance analysis and progress tracking
- Personal best time recording

## Tech Stack

- **Framework:** Nuxt 3
- **UI:** Nuxt UI + Tailwind CSS
- **Icons:** Nuxt Icon
- **Images:** Nuxt Image
- **Fonts:** Nuxt Fonts
- **SEO:** Nuxt SEO
- **Language:** TypeScript
- **Package Manager:** Bun

## Local Development

### Prerequisites

- Node.js 18+ or Bun runtime
- Git

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/mkwlog.git
cd mkwlog
```

1. Install dependencies:

```bash
# Using Bun (recommended)
bun install

# Or using npm
npm install

# Or using pnpm
pnpm install

# Or using yarn
yarn install
```

### Development Server

Start the development server on `http://localhost:3000`:

```bash
# Using Bun (recommended)
bun run dev

# Or using npm
npm run dev

# Or using pnpm
pnpm dev

# Or using yarn
yarn dev
```

### Building for Production

Build the application for production:

```bash
# Using Bun
bun run build

# Or using npm
npm run build

# Or using pnpm
pnpm build

# Or using yarn
yarn build
```

### Preview Production Build

Locally preview the production build:

```bash
# Using Bun
bun run preview

# Or using npm
npm run preview

# Or using pnpm
pnpm preview

# Or using yarn
yarn preview
```

## Project Structure

```text
├── assets/           # Stylesheets and other assets
├── public/           # Static files (images, icons, etc.)
│   ├── characters/   # Character images
│   ├── circuits/     # Circuit images
│   └── vehicles/     # Vehicle images
├── server/           # Server-side code
├── app.vue          # Root Vue component
├── nuxt.config.ts   # Nuxt configuration
└── package.json     # Dependencies and scripts
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

The source code is open source and available under the [MIT License](LICENSE.md).

**Note**: Nintendo-owned assets (character, circuit, and vehicle images) are not covered by this license and remain the intellectual property of Nintendo Co., Ltd. See [LICENSE.md](LICENSE.md) for full details.

## Disclaimer

This project is not affiliated with, endorsed by, or sponsored by Nintendo Co., Ltd. Mario Kart is a trademark of Nintendo Co., Ltd. All character images, circuit images, vehicle images, and other Mario Kart-related assets are used under fair use for educational/fan project purposes.
