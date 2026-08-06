import React from "react";
import { PreviewStyle } from "../types";
import { getTableClasses } from "../styles";

interface TableSubComponentProps {
  children: React.ReactNode;
  theme: PreviewStyle;
}

export function CustomTableWrapper({
  children,
  theme,
}: TableSubComponentProps) {
  const classes = getTableClasses(theme);
  return (
    <div className={classes.wrapper}>
      <table className={classes.table}>{children}</table>
    </div>
  );
}

export function CustomThead({ children, theme }: TableSubComponentProps) {
  const classes = getTableClasses(theme);
  return <thead className={classes.thead}>{children}</thead>;
}

export function CustomTbody({ children, theme }: TableSubComponentProps) {
  const classes = getTableClasses(theme);
  return <tbody className={classes.tbody}>{children}</tbody>;
}

export function CustomTr({ children, theme }: TableSubComponentProps) {
  const classes = getTableClasses(theme);
  return <tr className={classes.tr}>{children}</tr>;
}

interface CellProps extends TableSubComponentProps {
  style?: React.CSSProperties;
}

export function CustomTh({ children, theme, style }: CellProps) {
  const classes = getTableClasses(theme);
  return (
    <th style={style} className={classes.th}>
      {children}
    </th>
  );
}

export function CustomTd({ children, theme, style }: CellProps) {
  const classes = getTableClasses(theme);
  return (
    <td style={style} className={classes.td}>
      {children}
    </td>
  );
}
