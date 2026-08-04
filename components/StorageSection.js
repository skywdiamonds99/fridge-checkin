import ItemCard from "./ItemCard";

export default function StorageSection({ type, items, onDecrease, onDelete }) {
  if (items.length === 0) return null;

  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
        {type}
      </h2>
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <ItemCard key={item.id} item={item} onDecrease={onDecrease} onDelete={onDelete} />
        ))}
      </ul>
    </section>
  );
}
