/** Renders editable copy where *starred words* get the accent colour. */
export default function Highlight({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\*[^*]+\*)/).map((part, i) =>
        part.length > 2 && part.startsWith("*") && part.endsWith("*") ? (
          <span key={i} className="highlight">
            {part.slice(1, -1)}
          </span>
        ) : (
          part
        )
      )}
    </>
  );
}
