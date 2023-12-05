export interface IProps {
  onUpdate: (props: { bass: number; high: number }) => void;
  onPlay: () => void;
  onPause: () => void;
}
