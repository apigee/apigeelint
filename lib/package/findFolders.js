/*
  Copyright 2022 Google LLC

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      https://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

const fs = require('fs');
const path = require('path');
const DO_NOT_FOLLOW = ['.git', 'node_modules'];
const findFoldersRecursiveSync = (src, targetFoldername) => {
        let exists = fs.existsSync(src),
            stats = exists && fs.lstatSync(src),
            isDirectory = exists && stats.isDirectory();
        if (isDirectory) {
          let reducer = (accumulator, current) => {
                let fullpath = path.join(src, current),
                    stats = fs.lstatSync(fullpath),
                    isDirectory = stats.isDirectory();
                if (isDirectory) {
                  if (current == targetFoldername) {
                    accumulator.push(fullpath);
                  }
                  else if (DO_NOT_FOLLOW.indexOf(current)<0) {
                    accumulator = accumulator.concat(findFoldersRecursiveSync(fullpath, targetFoldername));
                  }
                }
                return accumulator;
              };
          return fs.readdirSync(src).reduce(reducer, []);
        }
        return [];
      };

module.exports = findFoldersRecursiveSync;
