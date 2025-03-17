import { ClipLoader } from "react-spinners";

interface SpinnerProps {
  size?: number;
}

export function Spinner({ size = 40 }: SpinnerProps) {
  return (
    <div className="flex justify-center items-center">
      <ClipLoader color="#38D479" size={size} />
    </div>
  );
} 