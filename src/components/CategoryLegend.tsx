import { CATEGORIES, categoryClass, categorySvg } from "../lib/categories";

export function CategoryMark({ category }: { category: string | null }) {
  return (
    <span className="type-mark" dangerouslySetInnerHTML={{ __html: categorySvg(category) }} />
  );
}

export function CategoryLegend({
  selected,
  onToggle,
}: {
  selected: string | null;
  onToggle: (category: string) => void;
}) {
  return (
    <div className="legend-block">
      <p className="legend-title">Place types</p>
      <ul className="legend" data-testid="legend" aria-label="Place types">
        {CATEGORIES.map((category) => (
          <li key={category}>
            <button
              type="button"
              className={`type-filter ${categoryClass(category)}`}
              data-testid={`type-${category}`}
              data-category={category}
              aria-pressed={selected === category}
              onClick={() => onToggle(category)}
            >
              <CategoryMark category={category} />
              {category}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
