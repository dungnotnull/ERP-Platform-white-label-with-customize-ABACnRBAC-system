import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/Select";

interface CustomSelectBoxProps {
  data: any[];
  title: string;
  onChange?: (value: string) => void;
}

const CustomSelectBox = ({ data, title, onChange }: CustomSelectBoxProps) => {
  return (
    <Select onValueChange={onChange}>
      <SelectTrigger className="w-full md:w-[200px] h-[50px] justify-center bg-primary text-white text-sm md:text-base flex items-center gap-3 rounded-[50px] [&_svg]:w-9 [&_svg]:h-9 [&_svg]:opacity-100">
        {title}: <SelectValue placeholder="ALL" />
      </SelectTrigger>
      <SelectContent className="bg-white">
        <SelectItem className="focus:bg-primary focus:text-white" value="ALL">
          ALL
        </SelectItem>
        {data.map((item, index) => (
          <SelectItem
            key={item.value || index}
            className="focus:bg-primary focus:text-white"
            value={item.value}
          >
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default CustomSelectBox;
