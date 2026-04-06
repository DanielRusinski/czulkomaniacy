// Przykład użycia:
<Panel title="Twoja Baza" icon={player.icon}>
  <div className="grid grid-cols-3 gap-4">
    <StatBadge label="Punkty" value={player.points} color="pink" icon="✨" />
    {/* ... reszta statystyk ... */}
  </div>
  <Button variant="blue" onClick={onBack} className="mt-8">Powrót</Button>
</Panel>