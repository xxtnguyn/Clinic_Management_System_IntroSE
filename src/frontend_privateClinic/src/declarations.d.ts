declare module "*.svg" {
  import React from "react";
  const SVG: React.FC<React.SVGProps<SVGSVGElement>>;
  export default SVG;
}

declare module "*.png" {
  const value: string;
  export default value;
}

declare module "*.jpg" {
  const value: string;
  export default value;
}

declare module "../components/TabHeaders" {
  import { FC } from "react";

  interface TabHeadersProps {
    activeTab: string;
    setActiveTab: React.Dispatch<React.SetStateAction<string>>;
    headers: string[];
  }

  const TabHeaders: FC<TabHeadersProps>;
  export default TabHeaders;
}

declare module "../components/BlueUnderline" {
  import { FC } from "react";
  const BlueUnderline: FC;
  export default BlueUnderline;
}

declare module "../components/Table" {
  import { FC } from "react";

  interface TableProps<T extends Record<string, any>> {
    headers: string[];
    filteredItems: T[];
    attributesOfItem: (keyof T)[];
  }

  const Table: <T extends Record<string, any>>(
    props: TableProps<T>
  ) => JSX.Element;
  export default Table;
}
