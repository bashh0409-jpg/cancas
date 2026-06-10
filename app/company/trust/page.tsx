export default function TrustCenter() {
  const [failed, setFailed] = React.useState(false);

  if (failed) {
    return <div>Loading native view...</div>; // replace with API renderer
  }

  return (
    <iframe
      src="https://maize-vault-44c.notion.site/Swiped-Inc-Trust-Center-1620bb4e3ce549ddba8330935878d23d"
      className="w-full h-screen border-0"
      onError={() => setFailed(true)}
    />
  );
}
