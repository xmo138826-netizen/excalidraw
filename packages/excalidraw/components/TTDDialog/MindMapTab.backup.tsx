/**
 * MindMapTab 组件 - 简化版本用于测试
 */

import React, { useState } from "react";
import { t } from "../../i18n";

import "./MindMapTab.scss";

interface MindMapTabProps {
  onTextSubmit: any;
}

export const MindMapTab = (props: MindMapTabProps) => {
  const [prompt, setPrompt] = useState("");

  return (
    <div className="mindmap-tab">
      <h3>思维导图生成</h3>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="输入思维导图主题..."
      />
      <button>生成思维导图</button>
    </div>
  );
};
