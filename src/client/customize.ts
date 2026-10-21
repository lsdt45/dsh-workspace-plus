/** Appearance customisation dialog (colour, glow, weight, shadow, icon) with a live preview. */

import { React, E, ui } from './platform.ts'
import { cls } from './core/text.ts'
import { icon } from './icons.ts'
import { iconOf, colorToRgb, rgbToHex } from './rows.ts'
import { BTN, StyleNode } from './ui/base.ts'
import type { Translate } from './core/time.ts'


/* --------------------- customization dialog ----------------------- */

export const SWATCHES = ['', '#5b8def', '#3fb950', '#d29922', '#f85149', '#a371f7', '#39c5cf', '#ec6cb9', '#ff9f45', '#6e7681']

export const GLOW_MAX = 14

export const ICON_CHOICES = [
  'solid', 'outline', 'none',
  'IconProjectAddOutline16', 'IconBranchOutline16', 'IconArchiveOutline20', 'IconCodeOutline16',
  'IconDataOutline16', 'IconGoalOutline16', 'IconGlobeOutline14', 'IconInspectOutline12',
  'IconCopyOutline16', 'IconLinkOutline16', 'IconListPenOutline16', 'IconChecklistOutline14',
  'IconBrowseOutline16', 'IconDownloadOutline16', 'IconContextInjectionOutline16',
  'IconCordisPluginOutline14', 'IconApiOutline14', 'IconAgentPresetOutline16', 'IconEnhanceOutline16',
  'IconSkillOutline16', 'IconSparkle16', 'IconNewChatOutline16',
  'IconCheckOutline14', 'IconCheckOutline16', 'IconChevronDownOutline14', 'IconChevronLeftOutline14',
  'IconChevronRightOutline14', 'IconChevronUpOutline14', 'IconCloseOutline16', 'IconDarkOutline16',
  'IconEditOutline16', 'IconEllipsisOutline16', 'IconFolderClose16', 'IconFolderOpen16',
  'IconFolderOpenOutline16', 'IconFullscreenOutline16', 'IconLightOutline16', 'IconLinkOutline14',
  'IconLoadingOutline16', 'IconPanelLeftOutline16', 'IconPaperclipOutline16', 'IconPersonalizationOutline16',
  'IconPlayOutline16', 'IconPauseOutline16', 'IconPlusOutline16', 'IconQuestionOutline14',
  'IconQueueOutline14', 'IconRefreshOutline14', 'IconRefreshOutline16', 'IconRightUpOutline14',
  'IconSearchOutline16', 'IconSendOutline14', 'IconSendOutline16', 'IconSettingsOutline14',
  'IconSettingsOutline16', 'IconShareOutline16', 'IconStopFill16', 'IconThinkOutline14',
  'IconThinkOutline16', 'IconTrashOutline16', 'IconUserOutline16', 'IconWarningOutline16',
  'IconLikeOutline16', 'IconDislikeOutline16', 'IconFollowsystemOutline16',
  'IconAlarmClockOutline16', 'IconClockOutline16', 'IconDatabaseOutline16',
]


/** Per-row appearance as stored; older entries may carry numeric strings. */
export interface CustomStyleInput {
  color?: string
  glow?: number | string
  weight?: number | string
  shadow?: boolean
  icon?: string
}

/** Per-row appearance this dialog commits; `null` means "use the defaults". */
export interface CustomStyle {
  color: string
  glow: number
  weight?: number
  shadow?: boolean
  icon?: string
}

/** Props of the appearance dialog opened from a row's context menu. */
export interface CustomizeDialogProps {
  open: boolean
  initial?: CustomStyleInput | null
  kind?: string
  onChange: (style: CustomStyle | null) => void
  onReset: () => void
  onClose: () => void
  t: Translate
}


/**
 * Per-row appearance: color swatches (+ native picker), glow intensity,
 * folder-glyph mode. Committing the defaults clears the entry; Reset
 * removes it entirely.
 */
export function CustomizeDialog({ open, initial, kind, onChange, onReset, onClose, t }: CustomizeDialogProps) {
  // Icons render only for workspace / workspace-folder rows. Session rows
  // already carry the official status dot (pending/running/done) in the
  // leading slot, and session sub-group rows have no icon either — so the
  // icon grid is offered only where it actually displays.
  const allowIcon = kind === 'folder' || kind === 'workspace'
  const [color, setColor] = React.useState('')
  const [glow, setGlow] = React.useState(0)
  const [iconMode, setIconMode] = React.useState('solid')
  const [weight, setWeight] = React.useState(0)
  const [shadow, setShadow] = React.useState(false)
  React.useEffect(() => {
    if (!open) return
    setColor(initial && initial.color ? initial.color : '')
    setGlow(initial && initial.glow ? Number(initial.glow) || 0 : 0)
    setIconMode(initial && initial.icon ? initial.icon : 'solid')
    setWeight(initial && initial.weight ? Number(initial.weight) || 0 : 0)
    setShadow(initial && initial.shadow === true)
  }, [open, initial])
  if (!open) return null
  const commit = () => {
    const empty = allowIcon
      ? (color === '' && glow === 0 && iconMode === 'solid' && weight === 0 && !shadow)
      : (color === '' && glow === 0 && weight === 0 && !shadow)
    const style = empty
      ? null
      : { color, glow, weight: weight > 0 ? weight : undefined, shadow: shadow || undefined, ...(allowIcon ? { icon: iconMode } : {}) }
    onChange(style)
    onClose()
  }
  const channels = colorToRgb(color)
  const setChannel = (index: number, raw: string) => {
    const n = Math.max(0, Math.min(255, parseInt(raw, 10) || 0))
    const base = channels || [0, 0, 0]
    const next = base.slice()
    next[index] = n
    setColor(rgbToHex(next[0], next[1], next[2]))
  }
  const previewShadows: string[] = []
  if (glow > 0 && color) previewShadows.push('0 0 ' + glow + 'px ' + color)
  if (shadow) previewShadows.push('1px 1px 2px rgba(0,0,0,.85)')
  return E(ui.Modal, {
    open: true,
    onClose,
    closeLabel: t('close'),
    title: t('custom.title'),
    footer: E('div', { className: 'bw-modal-actions' },
      E(BTN, { variant: 'outline', onClick: () => { onReset(); onClose() } }, t('custom.reset')),
      E(BTN, { variant: 'primary', onClick: commit }, t('custom.done')),
    ),
  },
    E('div', { className: 'bw-modal-body' },
      E('div', { className: 'bw-field' },
        t('custom.color'),
        E('div', { className: 'bw-dialog-input-row' },
          SWATCHES.map((swatch) => E('button', {
            key: swatch || 'none',
            type: 'button',
            className: cls('bw-swatch', color === swatch && 'bw-swatch-active'),
            style: swatch === '' ? undefined : { background: swatch },
            'aria-label': swatch === '' ? t('custom.reset') : swatch,
            onClick: () => setColor(swatch),
          })),
          E('input', {
            type: 'color',
            className: 'bw-color-input',
            value: color || '#5b8def',
            onChange: (e: any) => setColor(e.target.value),
          }),
        ),
        E('div', { className: 'bw-rgb-row' },
          ['R', 'G', 'B'].map((label, index) => E('label', { key: label, className: 'bw-rgb-label' },
            label,
            E('input', {
              type: 'number',
              className: 'bw-rgb-input',
              min: 0,
              max: 255,
              value: channels ? channels[index] : '',
              placeholder: '—',
              onChange: (e: any) => setChannel(index, e.target.value),
            }),
          )),
        ),
      ),
      E('div', { className: 'bw-field' },
        t('custom.glow'),
        E('div', { className: 'bw-glow-row' },
          E('input', {
            type: 'range',
            className: 'bw-slider',
            min: 0,
            max: GLOW_MAX,
            step: 1,
            value: glow,
            'aria-label': t('custom.glow'),
            onChange: (e: any) => setGlow(Number(e.target.value)),
          }),
          E('span', { className: 'bw-glow-value' }, glow === 0 ? t('custom.none') : glow + 'px'),
        ),
      ),
      E('div', { className: 'bw-field' },
        t('custom.weight'),
        E('div', { className: 'bw-seg' },
          [400, 500, 600, 700].map((wt) => E('button', {
            key: String(wt),
            type: 'button',
            className: cls('bw-seg-btn', weight === wt && 'bw-seg-btn-active'),
            onClick: () => setWeight(wt),
          }, wt === 400 ? t('custom.weight.regular') : wt === 500 ? t('custom.weight.medium') : wt === 600 ? t('custom.weight.semibold') : t('custom.weight.bold'))),
        ),
      ),
      E('div', { className: 'bw-field' },
        t('custom.shadow'),
        E('div', { className: 'bw-seg' },
          E('button', { type: 'button', className: cls('bw-seg-btn', !shadow && 'bw-seg-btn-active'), onClick: () => setShadow(false) }, t('custom.none')),
          E('button', { type: 'button', className: cls('bw-seg-btn', shadow && 'bw-seg-btn-active'), onClick: () => setShadow(true) }, t('settings.on')),
        ),
      ),
      allowIcon ? E('div', { className: 'bw-field' },
        t('custom.icon'),
        E('div', { className: 'bw-icon-grid' },
          ICON_CHOICES.map((mode) => E('button', {
            key: mode,
            type: 'button',
            className: cls('bw-icon-cell', iconMode === mode && 'bw-icon-cell-active'),
            title: mode === 'solid' ? t('custom.icon.solid') : (mode === 'outline' ? t('custom.icon.outline') : mode),
            'aria-label': mode === 'solid' ? t('custom.icon.solid') : (mode === 'outline' ? t('custom.icon.outline') : mode),
            onClick: () => setIconMode(mode),
          }, mode === 'none' ? E('span', { className: 'bw-icon-none' }) : iconOf(mode, false))),
        ),
      ) : null,
      E('div', { className: 'bw-field' },
        t('custom.preview'),
        E('div', {
          className: 'bw-preview',
          style: {
            color: color || undefined,
            fontWeight: weight > 0 ? weight : undefined,
            textShadow: previewShadows.length > 0 ? previewShadows.join(',') : undefined,
          },
        },
          allowIcon ? E('span', { className: 'bw-preview-icon' }, iconOf(iconMode, true)) : null,
          E('span', { className: 'bw-preview-label' }, t('custom.preview.sample')),
        ),
      ),
    ),
    StyleNode(),
  )
}
