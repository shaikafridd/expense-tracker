describe('apiClient', () => {
  let auth: any;
  let apiFetch: any;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    jest.resetModules();
    localStorage.clear();
    fetchMock = jest.fn();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  function loadClient() {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const client = require('./apiClient');
    auth = client.auth;
    apiFetch = client.apiFetch;
  }

  describe('apiFetch', () => {
    it('should inject Authorization header when token exists', async () => {
      localStorage.setItem('sage_wealth_jwt', 'test-token');
      localStorage.setItem('sage_wealth_user', JSON.stringify({
        id: '1',
        email: 'test@example.com',
        user_metadata: { full_name: 'Test' }
      }));

      loadClient();

      fetchMock.mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: jest.fn().mockResolvedValue({ data: 'some-data' }),
      });

      const result = await apiFetch('/test-endpoint');

      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:5000/api/test-endpoint',
        expect.objectContaining({
          headers: expect.any(Headers),
        })
      );
      
      const calls = fetchMock.mock.calls[0];
      const headers = calls[1].headers as Headers;
      expect(headers.get('Authorization')).toBe('Bearer test-token');
      expect(headers.get('Content-Type')).toBe('application/json');
      expect(result).toEqual({ data: 'some-data' });
    });

    it('should handle 401 response and force logout', async () => {
      loadClient();

      fetchMock.mockResolvedValueOnce({
        status: 401,
        ok: false,
        json: jest.fn().mockResolvedValue({ message: 'Unauthorized' }),
      });

      const signOutSpy = jest.spyOn(auth, 'signOut');

      await expect(apiFetch('/test-endpoint')).rejects.toThrow('Not authenticated');
      expect(signOutSpy).toHaveBeenCalled();
    });
  });

  describe('auth methods', () => {
    it('signUp should save session details on success', async () => {
      loadClient();

      const mockUser = { id: 'user123', email: 'user@test.com', user_metadata: { full_name: 'Test Name' } };
      const mockToken = 'jwt-token-123';

      fetchMock.mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: jest.fn().mockResolvedValue({ user: mockUser, token: mockToken }),
      });

      const response = await auth.signUp({
        email: 'user@test.com',
        password: 'password123',
        options: { data: { full_name: 'Test Name' } },
      });

      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:5000/api/auth/signup',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            email: 'user@test.com',
            password: 'password123',
            full_name: 'Test Name',
          }),
        })
      );

      expect(localStorage.getItem('sage_wealth_jwt')).toBe(mockToken);
      expect(localStorage.getItem('sage_wealth_user')).toContain('user123');
      expect(response.data).toEqual({ user: mockUser, token: mockToken });
      expect(response.error).toBeNull();
    });

    it('signInWithPassword should save session details on success', async () => {
      loadClient();

      const mockUser = { id: 'user123', email: 'user@test.com', user_metadata: { full_name: 'Test Name' } };
      const mockToken = 'jwt-token-123';

      fetchMock.mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: jest.fn().mockResolvedValue({ user: mockUser, token: mockToken }),
      });

      const response = await auth.signInWithPassword({
        email: 'user@test.com',
        password: 'password123',
      });

      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:5000/api/auth/signin',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            email: 'user@test.com',
            password: 'password123',
          }),
        })
      );

      expect(localStorage.getItem('sage_wealth_jwt')).toBe(mockToken);
      expect(response.data).toEqual({ user: mockUser, token: mockToken });
      expect(response.error).toBeNull();
    });

    it('signOut should clear storage', () => {
      localStorage.setItem('sage_wealth_jwt', 'jwt-token');
      localStorage.setItem('sage_wealth_user', JSON.stringify({ id: '123', email: 'user@test.com' }));

      loadClient();

      auth.signOut();

      expect(localStorage.getItem('sage_wealth_jwt')).toBeNull();
      expect(localStorage.getItem('sage_wealth_user')).toBeNull();
    });

    it('onAuthStateChange should register listener and notify immediately', () => {
      loadClient();

      const listenerSpy = jest.fn();
      
      const { data } = auth.onAuthStateChange(listenerSpy);
      
      // Triggers with INITIAL_STATE
      expect(listenerSpy).toHaveBeenCalledWith('INITIAL_STATE', null);
      
      // Cleanup subscription
      data.subscription.unsubscribe();
    });
  });
});
