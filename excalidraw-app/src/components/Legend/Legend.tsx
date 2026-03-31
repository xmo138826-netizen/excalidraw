/**
 * Legend 组件
 *
 * 显示思维导图的统计信息和图例
 * 支持折叠/展开、位置配置
 */

import React, { useState } from "react";

import clsx from "clsx";

import "./Legend.scss";

import type { LegendProps, LegendItem, LegendStats } from "./Legend.types";

export const Legend: React.FC<LegendProps> = ({
  items,
  stats,
  position = "bottom-right",
  isCollapsible = true,
  defaultCollapsed = false,
  className,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  const handleToggle = () => {
    if (isCollapsible) {
      setIsCollapsed(!isCollapsed);
    }
  };

  return (
    <div
      className={clsx(
        "cyber-legend",
        `cyber-legend--${position}`,
        {
          "cyber-legend--collapsed": isCollapsed,
        },
        className,
      )}
    >
      {/* 标题栏 */}
      <div
        className={clsx("cyber-legend__header", {
          "cyber-legend__header--clickable": isCollapsible,
        })}
        onClick={handleToggle}
        role={isCollapsible ? "button" : undefined}
        tabIndex={isCollapsible ? 0 : undefined}
        onKeyPress={(e) => {
          if (isCollapsible && (e.key === "Enter" || e.key === " ")) {
            handleToggle();
          }
        }}
      >
        <span className="cyber-legend__title">LEGEND</span>
        {isCollapsible && (
          <span
            className={clsx("cyber-legend__toggle", {
              "cyber-legend__toggle--collapsed": isCollapsed,
            })}
          >
            {isCollapsed ? "◀" : "▼"}
          </span>
        )}
      </div>

      {/* 内容区域 */}
      {!isCollapsed && (
        <div className="cyber-legend__content">
          {/* 统计信息 */}
          {stats && (
            <div className="cyber-legend__stats">
              <div className="cyber-legend__stat">
                <span className="cyber-legend__stat-label">节点总数</span>
                <span className="cyber-legend__stat-value">
                  {stats.totalNodes}
                </span>
              </div>
              <div className="cyber-legend__stat">
                <span className="cyber-legend__stat-label">最大深度</span>
                <span className="cyber-legend__stat-value">
                  {stats.maxDepth}
                </span>
              </div>
              <div className="cyber-legend__stat">
                <span className="cyber-legend__stat-label">元素总数</span>
                <span className="cyber-legend__stat-value">
                  {stats.totalElements}
                </span>
              </div>
            </div>
          )}

          {/* 图例项 */}
          {items.length > 0 && (
            <div className="cyber-legend__items">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="cyber-legend__item"
                  style={{
                    borderColor: item.color,
                    boxShadow: item.glow ? `0 0 10px ${item.color}` : undefined,
                  }}
                >
                  <div
                    className="cyber-legend__color"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="cyber-legend__label">{item.label}</span>
                  {item.count !== undefined && (
                    <span className="cyber-legend__count">{item.count}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * 从思维导图数据生成图例项
 */
export const generateLegendItems = (
  levelColors: Map<number, string>,
  levelCounts: Map<number, number>,
): LegendItem[] => {
  const items: LegendItem[] = [];

  levelColors.forEach((color, level) => {
    items.push({
      color,
      label: `层级 ${level}`,
      count: levelCounts.get(level),
      glow: level === 0, // 根节点发光
    });
  });

  return items;
};

/**
 * 生成统计信息
 */
export const generateStats = (
  totalNodes: number,
  totalConnections: number,
  maxDepth: number,
): LegendStats => {
  return {
    totalNodes,
    maxDepth,
    totalElements: totalNodes + totalConnections, // 节点 + 连接线
  };
};

export default Legend;
