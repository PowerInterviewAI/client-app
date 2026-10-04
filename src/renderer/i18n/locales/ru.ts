/**
 * Russian.
 *
 * Typed as `Translation`, so this file cannot drift from `en.ts`: a key that is missing is a
 * build error, and so is one that is spelled differently.
 *
 * Two things about the copy itself. Dashes are hyphens rather than the «—» Russian typography
 * would normally use, because this repository's writing rules forbid generating em-dashes and
 * the English source uses hyphens in the same positions. And the register matches the English:
 * direct, second-person formal, and no more words than the English string uses - Russian runs
 * roughly 15% longer than English for the same sentence, and these strings sit in a window whose
 * minimum width is 840px.
 */
import type { Translation } from './en';

/**
 * Russian has three plural forms and which one a number takes is not a property of the number
 * alone, so it cannot be expressed as a `{{count}}` placeholder: 1 балл, 2 балла, 5 баллов, and
 * 11 балл**ов** again despite ending in 1.
 *
 * Exported for the locale's own use only. Callers pass a number and get a finished string.
 */
export function plural(n: number, one: string, few: string, many: string): string {
  const mod100 = Math.abs(n) % 100;
  const mod10 = mod100 % 10;
  if (mod100 >= 11 && mod100 <= 14) return many;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
}

export const ru: Translation = {
  common: {
    cancel: 'Отмена',
    close: 'Закрыть',
    back: 'Назад',
    continue: 'Далее',
    finish: 'Готово',
    retry: 'Повторить',
    view: 'Открыть',
    loading: 'Загрузка…',
  },

  uiLanguageField: {
    label: 'Язык приложения',
    description:
      'Сам интерфейс: кнопки, заголовки и сообщения. Язык собеседования настраивается отдельно.',
  },

  onboarding: {
    firstRunEyebrow: (appName: string) => `Настройка ${appName}`,
    guideEyebrow: 'Руководство по настройке',
    progress: (current: number, total: number, label: string) =>
      `Шаг ${current} из ${total} · ${label}`,

    steps: {
      uiLanguage: {
        label: 'Язык приложения',
        title: 'На каком языке показывать приложение?',
        description:
          'Выберите язык, на котором вам удобнее читать. Всё дальше, включая этот шаг, будет на нём.',
      },
      profile: {
        label: 'Профиль',
        title: 'Расскажите о себе',
        description:
          'Все подсказки пишутся на основе этого - вашим опытом и вашими словами. Без этого приложение работать не сможет.',
      },
      context: {
        label: 'О вакансии',
        title: 'На какую позицию вы проходите собеседование?',
        description:
          'Необязательно, но стоит вставить: с описанием вакансии ассистент отвечает именно для этой роли, а не в общем.',
      },
      language: {
        label: 'Язык',
        title: 'Выберите язык собеседования',
        description: 'Он задаёт и то, что распознаётся, и то, на каком языке приходят подсказки.',
      },
      microphone: {
        label: 'Микрофон',
        title: 'Выберите микрофон',
        description:
          'Выберите микрофон, в который вы действительно будете говорить, и проверьте его. На собеседовании используйте наушники - через динамики приложение слышит интервьюера вашим микрофоном и замолкает.',
      },
      mode: {
        label: 'Подсказки',
        title: 'Какими должны быть подсказки?',
        description: 'Это можно изменить в любой момент, в том числе во время собеседования.',
      },
      mockHints: {
        label: 'Пробное собеседование',
        title: 'Показывать подсказки в пробном собеседовании?',
        description:
          'Пробное собеседование - это тренировка против ИИ-интервьюера. Здесь вы решаете, будет ли он подсказывать ответы.',
      },
      zoom: {
        label: 'Размер',
        title: 'Так читать удобно?',
        description:
          'Окно собеседования небольшое специально, чтобы не закрывать звонок. Настройте размер сейчас, пока есть время, а не посреди вопроса.',
      },
      transcript: {
        label: 'Расшифровка',
        title: 'И последнее',
        description: 'Показывать ли расшифровку разговора под подсказками.',
      },
    },

    blocked: {
      accountUnreachable:
        'Не удалось связаться с вашей учётной записью, поэтому введённое здесь пока нельзя сохранить.',
      needName: 'Укажите полное имя, чтобы продолжить.',
      needProfile: 'Добавьте профиль, чтобы продолжить.',
    },

    loadingAccount: 'Загружаем вашу учётную запись…',
    accountUnreachable:
      'Не удалось связаться с учётной записью. Введённое здесь нельзя сохранить, пока связь не восстановится.',

    skip: 'Пропустить',
    skipTooltip: 'Настройку можно пройти позже в разделе «Настройки»',

    allSet: 'Всё готово',
    profileNotSavedOnSkip:
      'Настройка пропущена, но профиль не сохранён. Попробуйте ещё раз в разделе «Учётная запись».',
    completionNotRecorded:
      'Настройка пропущена, но сохранить это не удалось. Возможно, она предложится снова.',
    saveProfileFailed: 'Не удалось сохранить профиль',
    finishFailed: 'Не удалось сохранить настройки. Проверьте подключение и попробуйте снова.',
  },

  configuration: {
    title: 'Настройки',
    setupGuide: {
      title: 'Руководство по настройке',
      description: 'Пройдите всё на этой странице, а также профиль, шаг за шагом.',
      action: 'Пройти настройку',
    },
    hotkeys: {
      title: 'Горячие клавиши',
      description: 'Всё, до чего можно дотянуться, не трогая приложение во время собеседования.',
    },
  },
};
