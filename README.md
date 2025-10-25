# Titration Simulator

An interactive 3D titration experiment simulator built with React, Three.js, and TypeScript. This educational tool allows students to perform virtual acid-base titrations with realistic animations and real-time pH monitoring.

## Features

- 🧪 **Realistic 3D Simulation**: Interactive beaker and burette with physics-based droplet animation
- 📊 **Real-time pH Monitoring**: Live pH calculations and titration curve plotting
- 🎨 **Visual Indicators**: Multiple pH indicators with color transitions
- 💾 **Data Persistence**: Save and load experiments using IndexedDB
- 📱 **Cross-platform**: Web-first with Android support via Capacitor
- 🎓 **Educational**: Built-in tutorial and guidance system

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Blender 3.x or 4.x (for 3D model generation)
- Android Studio (for Android builds)

### Installation

1. **Clone and install dependencies:**
```bash
cd titration-app
npm install
```

2. **Generate 3D models (optional):**
   - Open Blender 3.x or 4.x
   - Go to Scripting workspace
   - Open `generate_beaker_burette.py` in the text editor
   - Run the script (Play button)
   - Export the "Titration_Export" collection as GLB format
   - Save as `src/assets/beaker_burette.glb`

3. **Start development server:**
```bash
npm run dev
```

4. **Open in browser:**
   - Navigate to `http://localhost:3000`
   - Follow the tutorial to get started

### Building for Production

```bash
# Build web version
npm run build

# Preview production build
npm run preview
```

### Android Setup

1. **Initialize Capacitor:**
```bash
npx cap init titration-app com.example.titration
npx cap add android
```

2. **Build and sync:**
```bash
npm run build
npx cap copy android
npx cap open android
```

3. **Run on device/emulator:**
   - Use Android Studio to build and run
   - Or use command line: `npx cap run android`

## Usage Guide

### Basic Operation

1. **Start Experiment**: Click "Start Titration" to begin
2. **Add Droplets**: Click anywhere on the scene or press Space
3. **Monitor Changes**: Watch pH values and color transitions
4. **View Graph**: Real-time titration curve updates
5. **Save Results**: Click "Save Experiment" when finished

### Controls

- **Mouse/Touch**: Click to add droplets
- **Keyboard**: Press Space to add droplets
- **Mobile**: Tap screen to interact

### Settings

- **Concentration**: Adjust NaOH concentration (0.01-1.0 M)
- **Droplet Size**: Control droplet volume (0.05-0.5 mL)
- **Indicator**: Choose from Phenolphthalein, Methyl Orange, or Bromothymol Blue

## Technical Architecture

### Core Components

- **Chemistry Engine** (`src/lib/chemistry/engine.ts`): pH calculations and solution state management
- **3D Scene** (`src/lib/three/scene.ts`): Three.js scene with physics and animations
- **Storage System** (`src/lib/storage/db.ts`): IndexedDB for experiment persistence
- **React Components**: Modular UI components for controls and visualization

### Key Technologies

- **React 18**: Component-based UI framework
- **Three.js**: 3D graphics and WebGL rendering
- **TypeScript**: Type-safe development
- **Chart.js**: Real-time data visualization
- **IndexedDB**: Client-side data persistence
- **Capacitor**: Cross-platform mobile deployment

## Development

### Project Structure

```
titration-app/
├── src/
│   ├── components/          # React UI components
│   ├── lib/
│   │   ├── chemistry/       # Chemistry calculations
│   │   ├── three/           # 3D scene management
│   │   └── storage/         # Data persistence
│   └── assets/              # 3D models and resources
├── public/                  # Static assets
├── generate_beaker_burette.py  # Blender model generator
└── capacitor.config.ts     # Capacitor configuration
```

### Adding New Features

1. **New Chemistry Reactions**: Extend `ChemistryEngine` class
2. **Additional Indicators**: Add to `indicator.ts` with color functions
3. **UI Components**: Create new React components in `src/components/`
4. **3D Models**: Use Blender script to generate new GLB models

### Performance Optimization

- **LOD Models**: Use lower-poly versions for distant objects
- **Texture Compression**: Compress GLB files with gltf-transform
- **Memory Management**: Dispose of Three.js objects properly
- **Mobile Optimization**: Reduce particle effects on low-end devices

## Troubleshooting

### Common Issues

1. **3D Models Not Loading**:
   - Ensure GLB file is in `src/assets/`
   - Check browser console for loading errors
   - Verify model has correct node names

2. **Performance Issues**:
   - Reduce droplet spawn rate
   - Lower Three.js render quality
   - Disable shadows on mobile

3. **Capacitor Build Errors**:
   - Update Capacitor to latest version
   - Clean Android project: `npx cap clean android`
   - Check Android SDK installation

4. **Blender Script Errors**:
   - Ensure Blender 3.x or 4.x
   - Check Python API compatibility
   - Verify object selection before operations

### Browser Compatibility

- **Chrome/Edge**: Full support
- **Firefox**: Full support
- **Safari**: Full support (iOS 14+)
- **Mobile Browsers**: Optimized for touch interaction

## Educational Use

### Learning Objectives

- Understand acid-base chemistry concepts
- Practice titration techniques
- Learn pH indicator behavior
- Analyze titration curves
- Develop laboratory skills

### Classroom Integration

1. **Pre-lab Preparation**: Use tutorial to introduce concepts
2. **Virtual Practice**: Students practice before real lab
3. **Data Analysis**: Export CSV data for further study
4. **Assessment**: Use saved experiments for evaluation

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For technical support or educational inquiries:
- Create an issue on GitHub
- Contact: [sammuti.com](https://sammuti.com)

## Roadmap

### Planned Features

- [ ] Multiple acid/base combinations
- [ ] Weak acid/base calculations
- [ ] 3D molecular visualization
- [ ] Teacher dashboard
- [ ] Multi-language support
- [ ] Advanced analytics

### Version History

- **v1.0.0**: Initial release with basic titration simulation
- **v1.1.0**: Added multiple indicators and data export
- **v1.2.0**: Mobile optimization and Capacitor integration
- **v1.3.0**: Enhanced 3D models and performance improvements

---

**Built with ❤️ for STEM education**
