import { Link, LinkProps } from "react-router-dom";
import { useUrlWithLanguage } from "@/shared/utils/urlWithLanguage";

interface LocalizedLinkProps extends LinkProps {
  preserveLanguage?: boolean;
}

const LocalizedLink = ({
  to,
  children,
  preserveLanguage = true,
  ...rest
}: LocalizedLinkProps) => {
  const { getUrlWithLanguage } = useUrlWithLanguage();

  const processedTo =
    preserveLanguage && typeof to === "string" ? getUrlWithLanguage(to) : to;

  return (
    <Link to={processedTo} {...rest}>
      {children}
    </Link>
  );
};

export default LocalizedLink;
