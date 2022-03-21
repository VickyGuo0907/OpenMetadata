/*
 *  Copyright 2021 Collate
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *  http://www.apache.org/licenses/LICENSE-2.0
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

import classNames from 'classnames';
import React, { FC, HTMLAttributes, useState } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { Link } from 'react-router-dom';
import { getUserPath } from '../../constants/constants';
import { CSMode } from '../../enums/codemirror.enum';
import { SQLQuery } from '../../generated/entity/data/table';
import SVGIcons, { Icons } from '../../utils/SvgUtils';
import { Button } from '../buttons/Button/Button';
import SchemaEditor from '../schema-editor/SchemaEditor';
interface QueryCardProp extends HTMLAttributes<HTMLDivElement> {
  query: SQLQuery;
}
const QueryCard: FC<QueryCardProp> = ({ className, query }) => {
  const [expanded, setExpanded] = useState<boolean>(false);
  const [, setIsCopied] = useState<boolean>(false);
  const [showCopiedText, setShowCopiedText] = useState<boolean>(false);

  const copiedTextHandler = () => {
    setShowCopiedText(true);
    setTimeout(() => {
      setShowCopiedText(false);
    }, 1000);
  };

  return (
    <div className={classNames('tw-bg-white tw-py-3 tw-mb-3', className)}>
      <div
        className="tw-cursor-pointer"
        onClick={() => setExpanded((pre) => !pre)}>
        <div
          className="tw-flex tw-py-1 tw-justify-between"
          data-testid="query-header">
          <p>
            Last run by{' '}
            <Link
              className="button-comp"
              to={getUserPath(query.user?.name as string)}>
              <button className="tw-font-medium tw-text-grey-body ">
                {query.user?.displayName ?? query.user?.name}
              </button>{' '}
            </Link>
            and took{' '}
            <span className="tw-font-medium">{query.duration} seconds</span>
          </p>

          <button>
            {expanded ? (
              <SVGIcons
                alt="copy"
                className="tw-mr-4"
                icon={Icons.ICON_UP}
                width="16px"
              />
            ) : (
              <SVGIcons
                alt="copy"
                className="tw-mr-4"
                icon={Icons.ICON_DOWN}
                width="16px"
              />
            )}
          </button>
        </div>
      </div>
      <div className="tw-border tw-border-main tw-rounded-md tw-p-px">
        <div
          className={classNames('tw-overflow-hidden tw-relative', {
            'tw-max-h-10': !expanded,
          })}>
          <CopyToClipboard
            text={query.query ?? ''}
            onCopy={(_text, result) => {
              setIsCopied(result);
              if (result) copiedTextHandler();
            }}>
            <Button
              className="tw-h-8 tw-ml-4 tw-absolute tw-right-4 tw-z-9999 tw--mt-px"
              data-testid="copy-query"
              size="custom"
              theme="default"
              title="Copy"
              variant="text">
              {showCopiedText ? (
                <span
                  className="tw-mr-1 tw-text-success tw-bg-success-lite tw-px-1 tw-rounded-md"
                  data-testid="copy-success">
                  Copied to the clipboard
                </span>
              ) : null}
              <SVGIcons alt="copy" icon={Icons.COPY} width="16px" />
            </Button>
          </CopyToClipboard>

          <SchemaEditor
            editorClass={classNames('table-query-editor')}
            mode={{ name: CSMode.SQL }}
            options={{
              styleActiveLine: false,
            }}
            value={query.query ?? ''}
          />
        </div>
      </div>
    </div>
  );
};

export default QueryCard;
