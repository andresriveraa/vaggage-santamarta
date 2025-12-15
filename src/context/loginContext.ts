import {createContext} from 'react';

const baseResponse = {
  userInfo: {
    type: 'success',
    data: {
      idToken:
        'eyJhbGciOiJSUzI1NiIsImtpZCI6ImZhMDcyZjc1Nzg0NjQyNjE1MDg3YzcxODJjMTAxMzQxZTE4ZjdhM2EiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiIyNDY2ODc0NzUwNy1lYjJuaHVlYjBpMHYxODlhcXNvNW9naG4wbGdoYWJwaS5hcHBzLmdvb2dsZXVzZXJjb250ZW50LmNvbSIsImF1ZCI6IjI0NjY4NzQ3NTA3LTRuNzFmYjM5MDdjamxzdWIwbHZhZDhrNTVsNWJuOGF0LmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwic3ViIjoiMTE2OTAzNTk1MDU0ODUxOTI5MzA0IiwiZW1haWwiOiJzZWJhc3JpdnZlcmFAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImF0X2hhc2giOiIyOUhDZC12WjRyZk52bFl6TU56cGFRIiwibm9uY2UiOiJESmgtOG1HWDVyM0w4cDl0X1VZLXVUeVVOMU0wVVFXSzVfX1J5ZUVnTDJNIiwibmFtZSI6IlNlYmFzIFJpdnZlcmEiLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUNnOG9jSUhKbW9qb1pvMnEyWU1VZElVaTJUWFNFMlhuYWJDRUthb3VIczl0OTRzYXlfR3NBPXM5Ni1jIiwiZ2l2ZW5fbmFtZSI6IlNlYmFzIiwiZmFtaWx5X25hbWUiOiJSaXZ2ZXJhIiwiaWF0IjoxNzM4ODAxMzgyLCJleHAiOjE3Mzg4MDQ5ODJ9.I_ZVcrah7wRN7G8IzIIW5C9bIV6ykGFOBc3qVIYxk5h5EhxL7oiOgRH2FzvQKP8qGYW4Iz47oR0hfnJ4e0HrY-fnnkE9cnbd_qJjPRM5J--2GkgUvU6_nz2HL6yS4gpKzc0sLJ8oynbx7V_oCgQtR7V8DecWddmm0ldaUiLeGXCHzgrGm46N3CWea8prLq5K5BwdYZV-JuQxMXXYxnT2kl_uWVEtlcw-7uunAJK63XsHZQssjBWnueMU5_hJ5YJ9KorLI-EZod8aqCwqO0sIDMglFwxk5I4fhOWwT04y3Iak0uMIwOMGFigaz1VdjS4DEMtPfGegrWOetfUnN8Lb7A',
      serverAuthCode:
        '4/0ASVgi3JkPdZbBaMGcSLTeqQT5Xw40Hk_QgonEmOPHDA2wX-WMf0Nbp-xdpwRLRCoUu--Vg',
      scopes: [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
        'openid',
      ],
      user: {
        givenName: 'Sebas',
        id: '116903595054851929304',
        email: 'sebasrivvera@gmail.com',
        name: 'Sebas Rivvera',
        familyName: 'Rivvera',
        photo:
          'https://lh3.googleusercontent.com/a/ACg8ocIHJmojoZo2q2YMUdIUi2TXSE2XnabCEKaouHs9t94say_GsA=s120',
      },
    },
  },
  tokens: {
    idToken:
      'eyJhbGciOiJSUzI1NiIsImtpZCI6ImZhMDcyZjc1Nzg0NjQyNjE1MDg3YzcxODJjMTAxMzQxZTE4ZjdhM2EiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiIyNDY2ODc0NzUwNy1lYjJuaHVlYjBpMHYxODlhcXNvNW9naG4wbGdoYWJwaS5hcHBzLmdvb2dsZXVzZXJjb250ZW50LmNvbSIsImF1ZCI6IjI0NjY4NzQ3NTA3LTRuNzFmYjM5MDdjamxzdWIwbHZhZDhrNTVsNWJuOGF0LmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwic3ViIjoiMTE2OTAzNTk1MDU0ODUxOTI5MzA0IiwiZW1haWwiOiJzZWJhc3JpdnZlcmFAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImF0X2hhc2giOiIyOUhDZC12WjRyZk52bFl6TU56cGFRIiwibm9uY2UiOiJESmgtOG1HWDVyM0w4cDl0X1VZLXVUeVVOMU0wVVFXSzVfX1J5ZUVnTDJNIiwibmFtZSI6IlNlYmFzIFJpdnZlcmEiLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUNnOG9jSUhKbW9qb1pvMnEyWU1VZElVaTJUWFNFMlhuYWJDRUthb3VIczl0OTRzYXlfR3NBPXM5Ni1jIiwiZ2l2ZW5fbmFtZSI6IlNlYmFzIiwiZmFtaWx5X25hbWUiOiJSaXZ2ZXJhIiwiaWF0IjoxNzM4ODAxMzgyLCJleHAiOjE3Mzg4MDQ5ODJ9.I_ZVcrah7wRN7G8IzIIW5C9bIV6ykGFOBc3qVIYxk5h5EhxL7oiOgRH2FzvQKP8qGYW4Iz47oR0hfnJ4e0HrY-fnnkE9cnbd_qJjPRM5J--2GkgUvU6_nz2HL6yS4gpKzc0sLJ8oynbx7V_oCgQtR7V8DecWddmm0ldaUiLeGXCHzgrGm46N3CWea8prLq5K5BwdYZV-JuQxMXXYxnT2kl_uWVEtlcw-7uunAJK63XsHZQssjBWnueMU5_hJ5YJ9KorLI-EZod8aqCwqO0sIDMglFwxk5I4fhOWwT04y3Iak0uMIwOMGFigaz1VdjS4DEMtPfGegrWOetfUnN8Lb7A',
    accessToken:
      'REMOVED_OAUTH_TOKEN',
  },
};

const BASE_LOGIN_CONTEXT = {
  login: baseResponse,
};

const LoginContext = createContext(BASE_LOGIN_CONTEXT);

export default LoginContext;
