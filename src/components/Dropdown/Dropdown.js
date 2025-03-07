import classNames from 'classnames';
import Icon from 'components/Icon';
import useOnClickOutside from 'hooks/useOnClickOutside';
import PropTypes from 'prop-types';
import React, { useCallback, useRef, useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import DataElementWrapper from 'components/DataElementWrapper';
import useArrowFocus from '../../hooks/useArrowFocus';

import './Dropdown.scss';

const DEFAULT_WIDTH = 100;

const propTypes = {
  items: PropTypes.array,
  images: PropTypes.array,
  width: PropTypes.number,
  currentSelectionKey: PropTypes.string,
  translationPrefix: PropTypes.string,
  getTranslationLabel: PropTypes.func,
  onClickItem: PropTypes.func,
  dataElement: PropTypes.string,
  disabled: PropTypes.bool,
  getCustomItemStyle: PropTypes.func,
  applyCustomStyleToButton: PropTypes.bool,
  placeholder: PropTypes.string,
  maxHeight: PropTypes.number,
  getKey: PropTypes.func,
  getDisplayValue: PropTypes.func,
  className: PropTypes.string,
  onOpened: PropTypes.func
};

function Dropdown({
  items = [],
  images = [],
  width = DEFAULT_WIDTH,
  currentSelectionKey,
  translationPrefix,
  getTranslationLabel,
  onClickItem,
  dataElement,
  disabled = false,
  applyCustomStyleToButton = true,
  getCustomItemStyle = () => ({}),
  placeholder = null,
  maxHeight,
  getKey = (item) => item,
  getDisplayValue = (item) => item,
  className = '',
  hasInput = false,
  displayButton = null,
  customDataValidator = () => true,
  isSearchEnabled = true,
  onOpened = () => {}
}) {
  const { t, ready: tReady } = useTranslation();
  const overlayRef = useRef(null);
  const buttonRef = useRef(null);
  const inputRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const onClose = useCallback(() => setIsOpen(false), []);
  const onToggle = useCallback((e) => {
    if (hasInput && e.target === inputRef?.current) {
      return;
    }

    e.preventDefault();

    if (disabled) {
      setIsOpen(false);
    } else {
      setIsOpen((prev) => !prev);
    }

    if (hasInput && !isOpen) {
      setTimeout(() => {
        inputRef?.current?.focus();
      });
    }

    // Checking if there is space to place the overlay under its trigger, if not, place it on the trigger's top.
    const overlayRect = overlayRef?.current?.getBoundingClientRect();
    const buttonRect = buttonRef.current.getBoundingClientRect();
    if (overlayRect && buttonRect.bottom + overlayRect.height > window.innerHeight) {
      overlayRef.current.style.top = `-${overlayRect.height}px`;
    } else {
      overlayRef.current.style.top = '28px';
    }
  }, [hasInput, isOpen, disabled]);

  // Close dropdown if WebViewer loses focus (ie, user clicks outside iframe).
  useEffect(() => {
    const onBlur = () => {
      setIsOpen(false);
    };
    window.addEventListener('blur', onBlur);

    return () => {
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setInputVal('');
    } else {
      onOpened();
    }
  }, [isOpen]);

  useArrowFocus(isOpen, onClose, overlayRef);

  const onClickOutside = useCallback((e) => {
    if (!buttonRef.current.contains(e.target)) {
      setIsOpen(false);
    }
  }, []);
  useOnClickOutside(overlayRef, onClickOutside);

  const onClickDropdownItem = useCallback(
    (e, key, i, displayValue) => {
      e.preventDefault();
      e.stopPropagation();
      onClickItem(key, i);
      setIsOpen(false);
      buttonRef.current.focus();

      if (inputRef?.current) {
        inputRef.current.value = displayValue;
      }
    },
    [onClickItem, inputRef.current],
  );

  const getTranslation = (prefix, key) => {
    if (getTranslationLabel) {
      return t(getTranslationLabel(key));
    }

    return t(`${prefix}.${key}`, key);
  };

  const getDropdownStyles = (item, maxheight) => {
    const dropdownItemStyles = getCustomItemStyle(item);
    if (maxheight) {
      dropdownItemStyles.lineHeight = '28px';
    }
    return dropdownItemStyles;
  };

  const renderDropdownImages = () => images.map((image) => (
    <DataElementWrapper
      key={image.key}
      type="button"
      dataElement={`dropdown-item-${image.key}`}
      className={classNames('Dropdown__item', { active: image.key === currentSelectionKey })}
      tabIndex={isOpen ? undefined : -1} // Just to be safe.
      onClick={(e) => onClickDropdownItem(e, image.key)}
    >
      <Icon glyph={image.src} className={image.className} />
    </DataElementWrapper>
  ));

  const getTranslatedDisplayValue = (item) => getTranslation(translationPrefix, getDisplayValue(item));

  const renderDropdownItems = () => items
    .filter((item) => !isSearchEnabled || getTranslatedDisplayValue(item).toLowerCase().includes(inputVal.toLowerCase()))
    .map((item, i) => {
      const key = getKey(item);
      const translatedDisplayValue = getTranslatedDisplayValue(item);

      return (
        <DataElementWrapper
          key={key}
          type="button"
          dataElement={`dropdown-item-${key}`}
          className={classNames('Dropdown__item', { active: key === currentSelectionKey })}
          onClick={(e) => onClickDropdownItem(e, key, i, translatedDisplayValue)}
          tabIndex={isOpen ? undefined : -1} // Just to be safe.
          style={getDropdownStyles(item, maxHeight)}
        >
          {translatedDisplayValue}
        </DataElementWrapper>
      );
    });

  let dropdownItems;
  let optionIsSelected;
  let selectedItem;
  let selectedItemDisplay;

  const hasImages = images && images.length > 0;
  if (hasImages) {
    const imageKeys = images.map((item) => item.key);
    const selectedImageIndex = getImageIndexFromKey(images, currentSelectionKey);
    optionIsSelected = imageKeys.some((key) => key === currentSelectionKey);

    let glyph = '';
    let className = '';
    if (selectedImageIndex > -1) {
      glyph = images[selectedImageIndex].src;
      className = images[selectedImageIndex].className;
    }

    selectedItemDisplay = (
      <Icon glyph={glyph} className={className} />
    );
    dropdownItems = useMemo(renderDropdownImages, [images, currentSelectionKey]);
  } else {
    optionIsSelected = items.some((item) => getKey(item) === currentSelectionKey);
    if (optionIsSelected) {
      selectedItem = items.find((item) => getKey(item) === currentSelectionKey);
      selectedItemDisplay = tReady ? getTranslation(translationPrefix, getDisplayValue(selectedItem)) : '';
    } else if (hasInput && currentSelectionKey) {
      optionIsSelected = !!currentSelectionKey;
      selectedItemDisplay = currentSelectionKey;
      selectedItem = currentSelectionKey;
    }

    dropdownItems = useMemo(renderDropdownItems, [
      currentSelectionKey,
      isOpen,
      items,
      onClickDropdownItem,
      inputVal,
      translationPrefix,
    ]);
  }

  const buttonStyle = { width: `${width}px` };
  const scrollItemsStyle = { maxHeight: `${maxHeight}px` };

  const createDropdownButton = useCallback((value) => {
    if (isOpen && hasInput) {
      const onInputChange = (e) => {
        e.preventDefault();
        inputRef.current.value = e.target.value;
        setInputVal(e.target.value);
      };

      const onBlur = () => {
        setInputVal('');
      };

      const onKeyDown = (e) => {
        if (e.key === 'Enter' && isOpen && inputRef.current) {
          const newValue = inputRef.current.value;
          let itemToClick = newValue;

          if (!customDataValidator(newValue)) {
            itemToClick = value;
          }

          if (items.length > 0) {
            const result = items.find((item) => getTranslatedDisplayValue(item).toLowerCase() === newValue.toLowerCase());
            if (result) {
              itemToClick = result;
            }
          }

          onClickItem(itemToClick, -1);
          inputRef?.current?.blur();
          setIsOpen(false);
        }
      };

      return (
        <input
          className="Dropdown__input"
          onBlur={onBlur}
          onChange={onInputChange}
          ref={inputRef}
          onKeyDown={onKeyDown}
        />
      );
    }

    return value;
  }, [
    hasInput,
    inputRef,
    buttonRef,
    onClickItem,
    isOpen,
    selectedItem,
    customDataValidator
  ]);

  return (
    <DataElementWrapper className={`Dropdown__wrapper ${className}`} dataElement={dataElement}>
      {!displayButton &&
        <button
          className={classNames({
            'Dropdown': true,
            [className]: className,
          })}
          style={buttonStyle}
          onMouseDown={onToggle}
          onTouchEnd={onToggle}
          ref={buttonRef}
          disabled={disabled}
        >
          <div className="picked-option">
            <div
              className="picked-option-text"
              style={(optionIsSelected && applyCustomStyleToButton) ? getCustomItemStyle(selectedItem) : {}}
            >
              {createDropdownButton(optionIsSelected ? selectedItemDisplay : (placeholder || ''))}
            </div>
            <Icon className="arrow" glyph={`icon-chevron-${isOpen ? 'up' : 'down'}`} />
          </div>
        </button>
      }
      {displayButton &&
        <div ref={buttonRef} onClick={onToggle}>
          {displayButton(isOpen)}
        </div>
      }
      <div
        className={classNames('Dropdown__items', { 'hide': !isOpen, 'dropdown-items-with-custom-display': displayButton })}
        ref={overlayRef}
        role="listbox"
        aria-label={t(`${translationPrefix}.dropdownLabel`)}
        style={maxHeight ? scrollItemsStyle : undefined}
      >
        {dropdownItems.length > 0 ?
          dropdownItems :
          <div className="Dropdown__item">{t('message.noResults')}</div>
        }
      </div>
    </DataElementWrapper>
  );
}

const getImageIndexFromKey = (imageArray, key) => {
  if (!imageArray || imageArray.length === 0) {
    return -1;
  }

  let imageIndex = -1;
  imageArray.forEach((image, index) => {
    if (image.key === key) {
      imageIndex = index;
    }
  });

  return imageIndex;
};

Dropdown.propTypes = propTypes;
export default Dropdown;