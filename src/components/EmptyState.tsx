import { Wagon } from "./Wagon";

export function EmptyBeen() {
  return (
    <div className="empty-been">
      <Wagon className="wagon" />
      <p className="been-stamp" aria-hidden="true">
        Been there
      </p>
      <p>The wagon is packed. Nothing in the passport yet.</p>
    </div>
  );
}

export function EmptyCopy({ children }: { children: string }) {
  return <p className="empty-copy">{children}</p>;
}
