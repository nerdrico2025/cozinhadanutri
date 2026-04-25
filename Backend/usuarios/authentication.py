from rest_framework_simplejwt.authentication import JWTAuthentication

class CustomCookieJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        print("COOKIES RECEBIDOS:", request.COOKIES)
        # Primeiro, tentar obter do header (padrão)
        header = self.get_header(request)
        
        if header is None:
            # Se não tiver no header, tenta buscar do cookie
            raw_token = request.COOKIES.get('access_token')
            if raw_token is not None:
                raw_token = raw_token.encode('utf-8')
        else:
            raw_token = self.get_raw_token(header)
            
        print("RAW TOKEN:", raw_token)
            
        if raw_token is None:
            return None

        validated_token = self.get_validated_token(raw_token)
        return self.get_user(validated_token), validated_token
