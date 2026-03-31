/**
 * Legend 组件类型定义
 */

/**
 * 图例项
 */
export interface LegendItem {
  color: string;
  label: string;
  count?: number;
  glow?: boolean;
}

/**
 * 统计信息
 */
export interface LegendStats {
  totalNodes: number;
  maxDepth: number;
  totalElements: number;
}

/**
 * Legend 组件属性
 */
export interface LegendProps {
  items: LegendItem[];
  stats?: LegendStats;
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  isCollapsible?: boolean;
  defaultCollapsed?: boolean;
  className?: string;
}

/**
 * 思维导图图例数据
 */
export interface MindMapLegendData {
  levelColors: Map<number, string>;
  levelCounts: Map<number, number>;
  totalNodes: number;
  totalConnections: number;
  maxDepth: number;
}
