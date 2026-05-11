/*
 * Copyright 2026 AIDO Team
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */
import React, { useState } from 'react';
import { RightOutlined, DownOutlined } from '@ant-design/icons';
import classnames from 'classnames';

interface IProps {
  isActive?: boolean;
  header: React.ReactNode;
  children?: React.ReactNode;
  extra?: React.ReactNode;
  isInner?: boolean;
  showArrow?: boolean;
  collapsible?: 'header' | 'icon';
}

export default function Panel(props: IProps) {
  const { showArrow = true, collapsible = 'header' } = props;
  const [isActive, setIsActive] = useState<boolean>(props.isActive ?? true);

  return (
    <div
      className={classnames({
        'aido-collapse-item': true,
        'aido-collapse-item-active': isActive,
        'aido-collapse-item-inner': props.isInner,
      })}
    >
      <div
        className='aido-collapse-header'
        onClick={() => {
          collapsible === 'header' && setIsActive(!isActive);
        }}
      >
        {showArrow ? (
          <span
            onClick={() => {
              collapsible === 'icon' && setIsActive(!isActive);
            }}
          >
            {isActive ? <DownOutlined className='aido-collapse-arrow' /> : <RightOutlined className='aido-collapse-arrow' />}
          </span>
        ) : null}
        {props.header}
        <div
          className='aido-collapse-extra'
          onClick={(e) => {
            e.stopPropagation();
            e.nativeEvent.stopImmediatePropagation();
          }}
        >
          {props.extra}
        </div>
      </div>
      {props.children && (
        <div
          className={classnames({
            'aido-collapse-content': true,
            'aido-collapse-content-hidden': !isActive,
          })}
        >
          <div className='aido-collapse-content-box'>{props.children}</div>
        </div>
      )}
    </div>
  );
}
