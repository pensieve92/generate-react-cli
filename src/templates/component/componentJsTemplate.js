module.exports = `import React from 'react';
import styles from './TemplateName.scss';
import classNames from 'classnames/bind';

const cx = classNames.bind(styles);

const TemplateName = () => (
  <div className={cx('TemplateName')} >
    TemplateName
  </div>
);

export default TemplateName;
`;
