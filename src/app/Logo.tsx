export interface Props {}

export default function Logo(props: Props) {
  return (
    <div className="w-6 h-6 bg-primary flex items-center justify-center rotate-45">
      <div className="w-3 h-3 border-2 border-white rotate-45"></div>
    </div>
  );
}
