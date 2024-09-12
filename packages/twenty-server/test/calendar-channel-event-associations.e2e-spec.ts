import request from 'supertest';

describe('calendarChannelEventAssociationsResolver (e2e)', () => {
  it('should find many calendarChannelEventAssociations', () => {
    const queryData = {
      query: `
        query calendarChannelEventAssociations {
          calendarChannelEventAssociations {
            edges {
              node {
                eventExternalId
                id
                createdAt
                updatedAt
                calendarChannelId
                calendarEventId
              }
            }
          }
        }
      `,
    };

    return request(global.app.getHttpServer())
      .post('/graphql')
      .set('Authorization', `Bearer ${global.accessToken}`)
      .send(queryData)
      .expect(200)
      .expect((res) => {
        expect(res.body.data).toBeDefined();
        expect(res.body.errors).toBeUndefined();
      })
      .expect((res) => {
        const data = res.body.data.calendarChannelEventAssociations;

        expect(data).toBeDefined();
        expect(Array.isArray(data.edges)).toBe(true);

        const edges = data.edges;

        if (edges.length > 0) {
          const calendarchanneleventassociations = edges[0].node;

          expect(calendarchanneleventassociations).toHaveProperty('eventExternalId');
          expect(calendarchanneleventassociations).toHaveProperty('id');
          expect(calendarchanneleventassociations).toHaveProperty('createdAt');
          expect(calendarchanneleventassociations).toHaveProperty('updatedAt');
          expect(calendarchanneleventassociations).toHaveProperty('calendarChannelId');
          expect(calendarchanneleventassociations).toHaveProperty('calendarEventId');
        }
      });
  });
});
