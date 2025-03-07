import React from 'react';
import ColorPalettePicker from './ColorPalettePicker';
import { useTranslation } from 'react-i18next';

export default {
  title: 'Components/ColorPalettePicker',
  component: ColorPalettePicker,
};

const color = { R: 100, G: 0, B: 0, A: 1 };
const customColors = ['#000000', '#ff1111', '#ffffff'];

export function Basic() {
  const [t] = useTranslation();
  function noop() {}
  const props = {
    t,
    color,
    customColors,
    getHexColor: noop,
    findCustomColorsIndex: noop,
    setColorToBeDeleted: noop,
  };
  return (
    <div>
      <ColorPalettePicker {...props} />
    </div>
  );
}

export function IgnoredColors() {
  const [t] = useTranslation();
  function noop() {}
  const colorsToIgnore = ['#000000', '#ffffff'];
  const props = {
    t,
    color,
    customColors,
    getHexColor: noop,
    findCustomColorsIndex: noop,
    setColorToBeDeleted: noop,
    colorsToIgnore,
  };
  return (
    <div>
      <ColorPalettePicker {...props} />
    </div>
  );
}