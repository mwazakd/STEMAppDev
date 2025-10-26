import GlassmorphismBeaker from './GlassmorphismBeaker';

export default function TestGlassmorphism() {
  return (
    <div>
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        zIndex: 1000,
        background: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '10px',
        borderRadius: '5px'
      }}>
        <h3>🧪 Glassmorphism Beaker Test</h3>
        <p>If you can see this, the component is loading!</p>
      </div>
      <GlassmorphismBeaker />
    </div>
  );
}
